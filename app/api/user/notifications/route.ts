import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface UpdateNotificationSettingsRequest {
  userId: string;
  settings: {
    emailNotifications?: boolean;
    mentionNotifications?: boolean;
    replyNotifications?: boolean;
    voteNotifications?: boolean;
    commentNotifications?: boolean;
    statusChangeNotifications?: boolean;
    digestEmail?: 'daily' | 'weekly' | 'never';
  };
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body: UpdateNotificationSettingsRequest = await request.json();

    if (body.userId && body.userId !== userId) {
       console.warn(`PUT /api/user/notifications: Mismatch between session user (${userId}) and body userId (${body.userId})`);
       return NextResponse.json({ message: 'Forbidden: User ID mismatch' }, { status: 403 });
    }

    const { settings } = body;

    if (settings.digestEmail && !['daily', 'weekly', 'never'].includes(settings.digestEmail)) {
        return NextResponse.json({ message: 'Invalid digestEmail value' }, { status: 400 });
    }

    const updatedPreferences = await prisma.userPreference.upsert({
      where: { userId: userId },
      update: {
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
        emailNotifications: settings.emailNotifications ?? true,
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
