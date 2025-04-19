import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { enforceBoardAdminMembership } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

interface RouteContext {
  params: {
    id: string; // boardId
    memberId: string; // userId of the member being acted upon
  };
}

// Helper function to record audit log
async function recordAuditLog(
  tx: Prisma.TransactionClient,
  boardId: string,
  organizationId: string | null, // Board might not belong to an org
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
    organizationId = board?.organizationId ?? null; // Use null if board has no org
  }

  // Only record if organizationId is known (audit logs are org-scoped for now)
  // Or adjust schema/logic if board-only audit logs are needed without an org link
  if (organizationId) {
    await tx.auditLog.create({
      data: {
        organizationId: organizationId,
        boardId: boardId,
        action: action,
        entityType: entityType,
        entityId: entityId,
        details: details ? JSON.stringify(details) : Prisma.JsonNull,
        userId: performedByUserId,
      },
    });
  } else {
    console.warn(`Audit log skipped: Could not determine organizationId for board ${boardId}`);
    // Optionally, implement board-specific logging if needed when no org exists
  }
}


// PATCH /api/boards/[id]/members/[memberId] - Ban/Change Role (Simplified: only Ban for now)
export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  const boardId = params.id;
  const targetUserId = params.memberId;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const requestingUserId = session.user.id;

  // 1. Check Permissions: Requesting user must be a board admin
  const permissionCheck = await enforceBoardAdminMembership(requestingUserId, boardId);
  if (permissionCheck instanceof NextResponse) {
    return permissionCheck; // User is not an admin or is banned
  }

  // 2. Prevent self-action
  if (requestingUserId === targetUserId) {
    return NextResponse.json({ message: 'Board admins cannot ban themselves.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { status, banReason } = body;

    // 3. Validate Input (Only supporting BAN for now via PATCH)
    if (status !== 'BANNED') {
      return NextResponse.json({ message: "Invalid status. Only 'BANNED' is supported via PATCH." }, { status: 400 });
    }

    // 4. Perform Ban within a transaction
    const updatedMember = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // a. Check if target user is also an admin (prevent banning last admin)
      const targetMember = await tx.boardMember.findUnique({
        where: { userId_boardId: { userId: targetUserId, boardId: boardId } },
        select: { role: true }
      });

      if (!targetMember) {
        throw new Error("Target user is not a member of this board.");
      }

      if (targetMember.role === 'ADMIN') {
        const adminCount = await tx.boardMember.count({
          where: { boardId: boardId, role: 'ADMIN' }
        });
        if (adminCount <= 1) {
          throw new Error("Cannot ban the last admin of the board.");
        }
      }

      // b. Update the board member's status
      const memberUpdate = await tx.boardMember.update({
        where: {
          userId_boardId: { userId: targetUserId, boardId: boardId },
        },
        data: {
          status: 'BANNED',
          bannedAt: new Date(),
          banReason: typeof banReason === 'string' ? banReason.trim() : null,
          bannedByUserId: requestingUserId,
        },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } } // Include user details
        }
      });

      // c. Record Audit Log
      await recordAuditLog(
        tx,
        boardId,
        null, // Let helper find orgId
        'BAN_BOARD_MEMBER',
        'USER',
        targetUserId,
        { banReason: memberUpdate.banReason },
        requestingUserId
      );

      return memberUpdate;
    });

    return NextResponse.json(updatedMember, { status: 200 });

  } catch (error: any) {
    console.error("Error banning board member:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: "Member not found." }, { status: 404 });
    }
    if (error.message.includes("Cannot ban the last admin")) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
     if (error.message.includes("Target user is not a member")) {
        return NextResponse.json({ message: error.message }, { status: 404 });
    }
    return NextResponse.json({ message: "Failed to ban board member." }, { status: 500 });
  }
}


// DELETE /api/boards/[id]/members/[memberId] - Unban/Remove (Simplified: only Unban for now)
export async function DELETE(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  const boardId = params.id;
  const targetUserId = params.memberId;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const requestingUserId = session.user.id;

  // 1. Check Permissions: Requesting user must be a board admin
  const permissionCheck = await enforceBoardAdminMembership(requestingUserId, boardId);
  if (permissionCheck instanceof NextResponse) {
    return permissionCheck; // User is not an admin or is banned
  }

   // 2. Prevent self-action (though admins shouldn't be banned)
  if (requestingUserId === targetUserId) {
    return NextResponse.json({ message: 'Board admins cannot unban themselves.' }, { status: 400 });
  }

  try {
    // 3. Perform Unban within a transaction
    const updatedMember = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // a. Check if the user is actually banned
        const currentMember = await tx.boardMember.findUnique({
             where: { userId_boardId: { userId: targetUserId, boardId: boardId } },
             select: { status: true }
        });

        if (!currentMember) {
            throw new Error("User not found in this board.");
        }
        if (currentMember.status !== 'BANNED') {
            throw new Error("User is not currently banned from this board.");
        }

        // b. Update the board member's status back to ACTIVE
        const memberUpdate = await tx.boardMember.update({
            where: {
                userId_boardId: { userId: targetUserId, boardId: boardId },
            },
            data: {
                status: 'ACTIVE',
                bannedAt: null,
                banReason: null,
                bannedByUserId: null,
            },
             include: {
                user: { select: { id: true, name: true, email: true, image: true } } // Include user details
            }
        });

         // c. Record Audit Log
        await recordAuditLog(
            tx,
            boardId,
            null, // Let helper find orgId
            'UNBAN_BOARD_MEMBER',
            'USER',
            targetUserId,
            null, // No extra details needed for unban
            requestingUserId
        );

        return memberUpdate; // Return the updated member details
    });

     return NextResponse.json(updatedMember, { status: 200 }); // Return updated member on success

  } catch (error: any) {
    console.error("Error unbanning board member:", error);
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: "Member not found." }, { status: 404 });
    }
    if (error.message.includes("User not found") || error.message.includes("User is not currently banned")) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to unban board member." }, { status: 500 });
  }
}
