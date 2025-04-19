import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: {
    id: string; // Changed from orgId to id
  };
}

export async function POST(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  const { id } = params; // Changed from orgId to id

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!id) { // Changed from orgId to id
    return NextResponse.json({ message: 'Organization ID is required' }, { status: 400 });
  }

  const userId = session.user.id;

  try {
    // Verify user is a member of the organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: userId,
          organizationId: id, // Changed from orgId to id
        },
      },
    });

    // Basic check: User must be a member. Add role checks if needed.
    if (!membership) {
      return NextResponse.json({ message: 'Forbidden: You are not a member of this organization' }, { status: 403 });
    }
    // Optional: Add role-based check, e.g., allow only 'ADMIN' or 'MEMBER'
    // if (!['ADMIN', 'MEMBER'].includes(membership.role)) {
    //   return NextResponse.json({ message: 'Forbidden: Insufficient permissions to create a board' }, { status: 403 });
    // }


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
        organizationId: id, // Changed from orgId to id
      },
    });

    return NextResponse.json(newBoard, { status: 201 });

  } catch (error: any) {
    console.error(`Error creating board in organization ${id}:`, error); // Changed from orgId to id
     // Distinguish between JSON parsing errors and other errors
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Failed to create board', error: error.message }, { status: 500 });
  }
}
