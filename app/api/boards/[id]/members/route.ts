import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { enforceActiveBoardMembership } from '@/lib/permissions'; // Import the helper
import { Prisma } from '@prisma/client'; // Import Prisma types

interface RouteContext { params: Promise<{ id: string }> } // Update interface if params is a Promise

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params; // Await params here
  const requestingUserId = session.user.id;
  const boardId = resolvedParams.id; // Use resolved params

  // Fetch creator details to always include them in members list
  const boardRecord = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      createdById: true, // needed for permission check
      createdBy: { select: { id: true, name: true, email: true, image: true } }
    }
  });
  if (boardRecord?.createdById !== requestingUserId) {
    // Enforce membership only for non-creators
    const permissionCheck = await enforceActiveBoardMembership(requestingUserId, boardId);
    if (permissionCheck instanceof NextResponse) {
      return permissionCheck;
    }
  }

  try {
    const membersData = await prisma.boardMember.findMany({
      where: { boardId: boardId }, // Use boardId variable
      select: {
        role: true,
        status: true,
        user: { select: { id: true, name: true, email: true, image: true } }
      }
    });

    // Define the shape of the data returned by Prisma
    type MemberData = {
      role: string;
      status: string;
      user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
      };
    };

    // Define the shape of the returned member object
    interface Member {
      id: string;
      name: string | null;
      email: string | null;
      avatar: string | null;
      role: string;
      status: string;
    }

    // Map the data to the desired format, providing explicit type for 'm'
    const result: Member[] = membersData.map((m: MemberData) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.image,
      role: m.role,
      status: m.status
    }));

    // Prepend the board creator if not already in members
    const creator = boardRecord?.createdBy;
    if (creator && !result.find((m) => m.id === creator.id)) {
      result.unshift({
        id: creator.id,
        name: creator.name,
        email: creator.email,
        avatar: creator.image,
        role: 'CREATOR',
        status: 'ACTIVE'
      });
    }

    return NextResponse.json(result);

  } catch (error: any) { // Add type 'any' to error for better inspection
    // Log more details about the error
    console.error(`Error fetching members for board ${resolvedParams.id}:`, { // Use resolvedParams here
        message: error.message,
        stack: error.stack,
        code: error.code, // Include Prisma error code if available
        meta: error.meta, // Include Prisma error meta if available
    });
    // Return a more informative error message in development, but keep it generic for production
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to fetch board members: ${error.message}`
      : 'Failed to fetch board members';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}