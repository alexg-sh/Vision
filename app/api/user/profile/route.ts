import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  // If userId is provided in query, fetch that user's profile (public view)
  // If no userId, fetch the logged-in user's profile (private view)
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
        email: true, // Be cautious about exposing email publicly if not intended
        image: true,
        bio: true,
        website: true,
        twitter: true,
        linkedin: true,
        github: true,
        // Add any other public profile fields you want to expose
        // Exclude sensitive fields like passwordHash
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
        // allow updating other safe fields if needed
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
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
