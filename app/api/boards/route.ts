import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

    // Create board and record audit log in one transaction
    const newBoard = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const board = await tx.board.create({
        data: {
          name: name.trim(),
          description: description || null,
          image: image || null,
          isPrivate: isPrivate || false,
          createdById: userId,
          organizationId: null, // null for personal boards
        },
      });
      // Only log if linked to an organization
      if (board.organizationId) {
        await tx.auditLog.create({
          data: {
            organization: { connect: { id: board.organizationId } },
            board: { connect: { id: board.id } },
            user: { connect: { id: userId } },
            action: 'CREATE_BOARD',
            entityType: 'BOARD',
            entityId: board.id,
          }
        });
      }
      return board;
    });

    return NextResponse.json(newBoard, { status: 201 });

  } catch (error: any) {
    console.error("Error creating personal board:", error);
    // Distinguish between JSON parsing errors and other errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    // Handle foreign key constraint violation where createdById doesn't exist
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json({ message: 'Invalid session user. Please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Failed to create board', error: error.message }, { status: 500 });
  }
}
