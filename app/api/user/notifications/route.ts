import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Define the expected shape of the request body
interface UpdateNotificationSettingsRequest {
  userId: string; // Ensure userId is passed or derive from session
  settings: {
    emailNotifications?: boolean;
    mentionNotifications?: boolean;
    replyNotifications?: boolean;
    voteNotifications?: boolean;
    commentNotifications?: boolean;
    statusChangeNotifications?: boolean;
    digestEmail?: 'daily' | 'weekly' | 'never';
    // Add any other settings fields here
  };
}

// PUT handler to update notification settings
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body: UpdateNotificationSettingsRequest = await request.json();

    // Optional: Validate if body.userId matches session.user.id if provided in body
    if (body.userId && body.userId !== userId) {
       console.warn(`PUT /api/user/notifications: Mismatch between session user (${userId}) and body userId (${body.userId})`);
       return NextResponse.json({ message: 'Forbidden: User ID mismatch' }, { status: 403 });
    }

    const { settings } = body;

    // Validate settings if necessary (e.g., check digestEmail value)
    if (settings.digestEmail && !['daily', 'weekly', 'never'].includes(settings.digestEmail)) {
        return NextResponse.json({ message: 'Invalid digestEmail value' }, { status: 400 });
    }

    // Find or create UserPreferences record
    // Using upsert ensures a record exists whether it's the first time or not
    const updatedPreferences = await prisma.userPreference.upsert({
      where: { userId: userId },
      update: {
        // Only update fields that are present in the request body.settings
        ...(settings.emailNotifications !== undefined && { emailNotifications: settings.emailNotifications }),
        ...(settings.mentionNotifications !== undefined && { mentionNotifications: settings.mentionNotifications }),
        ...(settings.replyNotifications !== undefined && { replyNotifications: settings.replyNotifications }),
        ...(settings.voteNotifications !== undefined && { voteNotifications: settings.voteNotifications }),
        ...(settings.commentNotifications !== undefined && { commentNotifications: settings.commentNotifications }),
        ...(settings.statusChangeNotifications !== undefined && { statusChangeNotifications: settings.statusChangeNotifications }),
        ...(settings.digestEmail !== undefined && { digestEmail: settings.digestEmail }),
      },
      create: {
        userId: userId,
        emailNotifications: settings.emailNotifications ?? true, // Default values on creation
        mentionNotifications: settings.mentionNotifications ?? true,
        replyNotifications: settings.replyNotifications ?? true,
        voteNotifications: settings.voteNotifications ?? false,
        commentNotifications: settings.commentNotifications ?? true,
        statusChangeNotifications: settings.statusChangeNotifications ?? true,
        digestEmail: settings.digestEmail ?? 'weekly',
      },
    });

    console.log(`PUT /api/user/notifications: Updated preferences for user ${userId}`);
    return NextResponse.json(updatedPreferences, { status: 200 });

  } catch (error) {
    console.error('PUT /api/user/notifications: Error updating notification settings:', error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// Optional: GET handler to fetch current settings
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        const preferences = await prisma.userPreference.findUnique({
            where: { userId: userId },
        });

        if (!preferences) {
            // Return default preferences if none exist yet
            return NextResponse.json({
                userId: userId,
                emailNotifications: true,
                mentionNotifications: true,
                replyNotifications: true,
                voteNotifications: false,
                commentNotifications: true,
                statusChangeNotifications: true,
                digestEmail: 'weekly',
            }, { status: 200 });
        }

        return NextResponse.json(preferences, { status: 200 });

    } catch (error) {
        console.error('GET /api/user/notifications: Error fetching notification settings:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
