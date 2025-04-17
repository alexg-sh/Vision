import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
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
        name: true,
        email: true, // Be cautious about exposing email publicly if not intended
        image: true,
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
