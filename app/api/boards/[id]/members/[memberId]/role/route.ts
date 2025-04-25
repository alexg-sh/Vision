import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as needed
import { prisma } from '@/lib/prisma';
import { enforceBoardAdminMembership } from '@/lib/permissions'; // Adjust path as needed
import { Prisma } from '@prisma/client';

// Define BoardMemberRole enum to match your Prisma schema
enum BoardMemberRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR', // Added moderator role support
  MEMBER = 'MEMBER',
  // Add other roles as defined in your schema
}

interface RouteContext {
  params: {
    id: string; // boardId
    memberId: string; // userId of the member being acted upon
  };
}

// Helper function to record audit log (assuming it exists and is correctly typed)
async function recordAuditLog(
  tx: Prisma.TransactionClient,
  boardId: string,
  organizationId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  details: object | null,
  performedByUserId: string
) {
  // Fetch the organization ID from the board if not provided
  if (!organizationId) {
    const board = await tx.board.findUnique({
      where: { id: boardId },
      select: { organizationId: true }
    });
    organizationId = board?.organizationId ?? null;
  }

  if (organizationId) {
    await tx.auditLog.create({
      data: {
        organization: { connect: { id: organizationId } },
        board: { connect: { id: boardId } }, // Connect to board relation
        action: action,
        entityType: entityType,
        entityId: entityId ?? '', // Ensure entityId is always a string (empty string if not provided)
        details: details ? JSON.stringify(details) : Prisma.JsonNull,
        user: { connect: { id: performedByUserId } }, // Connect to user relation
      },
    });
  } else {
    console.warn(`Audit log skipped: Could not determine organizationId for board ${boardId}`);
    // Optionally, implement board-specific logging if needed when no org exists
  }
}


// PATCH /api/boards/[id]/members/[memberId]/role - Change Role
export async function PATCH(req: Request, { params: { id: boardId, memberId: targetUserId } }: RouteContext) { // Destructure params here
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const requestingUserId = session.user.id;

  // 1. Check Permissions: Requesting user must be a board admin
  const permissionCheck = await enforceBoardAdminMembership(requestingUserId, boardId);
  if (permissionCheck instanceof NextResponse) {
    return permissionCheck; // User is not an admin or is banned
  }

  // 2. Prevent self-role change
  if (requestingUserId === targetUserId) {
    return NextResponse.json({ message: 'Board admins cannot change their own role.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { role: newRole } = body;

    // 3. Validate Input Role
    if (!newRole || !Object.values(BoardMemberRole).includes(newRole as BoardMemberRole)) {
      return NextResponse.json({ message: `Invalid role provided. Must be one of: ${Object.values(BoardMemberRole).join(', ')}` }, { status: 400 });
    }

    // 4. Perform Role Change within a transaction
    const updatedMember = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // a. Get current member details and check if they exist
      const currentMember = await tx.boardMember.findUnique({
        where: { userId_boardId: { userId: targetUserId, boardId: boardId } },
        select: { role: true, status: true }
      });

      if (!currentMember) {
        throw new Error("Target user is not a member of this board.");
      }
      if (currentMember.status === 'BANNED') {
         throw new Error("Cannot change the role of a banned member.");
      }

      // b. Prevent removing the last admin
      const board = await tx.board.findUnique({
        where: { id: boardId },
        select: { createdById: true }
      });
      const isCreator = board?.createdById === targetUserId;
      // Only block if NOT the creator
      if (!isCreator && currentMember.role === BoardMemberRole.ADMIN && newRole !== BoardMemberRole.ADMIN) {
        // Exclude the creator from the admin count
        const adminCount = await tx.boardMember.count({
          where: {
            boardId: boardId,
            role: BoardMemberRole.ADMIN,
            status: { not: 'BANNED' },
            userId: { not: board?.createdById }
          }
        });
        // If no other admin (besides the creator), block
        if (adminCount < 1) {
          throw new Error("Cannot change the role of the last admin.");
        }
      }
      // If the target is the creator, allow role change regardless of admin count

      // c. Update the board member's role
      const memberUpdate = await tx.boardMember.update({
        where: {
          userId_boardId: { userId: targetUserId, boardId: boardId },
        },
        data: {
          role: newRole as BoardMemberRole,
        },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } } // Include user details for response
        }
      });

      // d. Record Audit Log
      await recordAuditLog(
        tx,
        boardId,
        null, // Let helper find orgId
        'UPDATE_BOARD_MEMBER_ROLE',
        'USER',
        targetUserId, // Pass the non-null targetUserId
        { oldRole: currentMember.role, newRole: memberUpdate.role },
        requestingUserId
      );

      return memberUpdate;
    });

    // 5. Return Success Response
    return NextResponse.json(updatedMember, { status: 200 });

  } catch (error: any) {
    console.error("Error changing board member role:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      // This might occur if the member was removed between checks, though less likely in a transaction
      return NextResponse.json({ message: "Member not found." }, { status: 404 });
    }
    if (error.message.includes("Target user is not a member") || error.message.includes("Cannot change the role of a banned member")) {
        return NextResponse.json({ message: error.message }, { status: 404 }); // Or 400 depending on context
    }
    if (error.message.includes("Cannot change the role of the last admin")) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
    // General error
    return NextResponse.json({ message: "Failed to change board member role." }, { status: 500 });
  }
}
