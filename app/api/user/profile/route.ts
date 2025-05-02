import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  const targetUserId = userId || session?.user?.id;

  if (!targetUserId) {
    return NextResponse.json({ error: 'User ID is required or user must be logged in' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        website: true,
        twitter: true,
        linkedin: true,
        github: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const body = await request.json();
  const { username, name, bio, avatar, website, twitter, linkedin, github } = body;
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        name,
        bio,
        image: avatar,
        website,
        twitter,
        linkedin,
        github,
      },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        bio: true,
        website: true,
        twitter: true,
        linkedin: true,
        github: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { followers: true, following: true } }
      }
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error('ERROR: NEXT_PUBLIC_BASE_URL environment variable is not defined.');
      return NextResponse.json({ error: 'Internal server configuration error: Base URL for audit log is missing.' }, { status: 500 });
    }

    try {
      await fetch(`${baseUrl}/api/audit-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_USER_PROFILE',
          entityType: 'USER',
          entityId: userId,
          entityName: name || username,
          details: { updatedFields: Object.keys({ username, name, bio, avatar, website, twitter, linkedin, github }).filter(key => !!body[key]) }
        })
      });
    } catch (fetchError) {
      console.error('Failed to send audit log after profile update:', fetchError);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update profile:', error);
    if (error instanceof Error && error.message.includes('Base URL for audit log is missing')) {
      return;
    }
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
