import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { name, description, image, isPrivate } = await req.json();

    // Basic validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ message: 'Board name is required' }, { status: 400 });
    }

    const newBoard = await prisma.board.create({
      data: {
        name: name.trim(),
        description: description || null,
        image: image || null,
        isPrivate: isPrivate || false,
        createdById: userId,
        organizationId: null, // Explicitly null for personal boards
      },
    });

    return NextResponse.json(newBoard, { status: 201 });

  } catch (error: any) {
    console.error("Error creating personal board:", error);
    // Distinguish between JSON parsing errors and other errors
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create board', error: error.message }, { status: 500 });
  }
}
