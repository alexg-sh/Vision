import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { enforceBoardAdminMembership } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

enum BoardMemberRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

interface RouteContext {
  params: {
    id: string;
    memberId: string;
  };
}

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
        board: { connect: { id: boardId } },
        action: action,
        entityType: entityType,
        entityId: entityId ?? '',
        details: details ? JSON.stringify(details) : Prisma.JsonNull,
        user: { connect: { id: performedByUserId } },
      },
    });
  } else {
    console.warn(`Audit log skipped: Could not determine organizationId for board ${boardId}`);
  }
}


export async function PATCH(req: Request, { params: { id: boardId, memberId: targetUserId } }: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const requestingUserId = session.user.id;

  const permissionCheck = await enforceBoardAdminMembership(requestingUserId, boardId);
  if (permissionCheck instanceof NextResponse) {
    return permissionCheck;
  }

  if (requestingUserId === targetUserId) {
    return NextResponse.json({ message: 'Board admins cannot change their own role.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { role: newRole } = body;

    if (!newRole || !Object.values(BoardMemberRole).includes(newRole as BoardMemberRole)) {
      return NextResponse.json({ message: `Invalid role provided. Must be one of: ${Object.values(BoardMemberRole).join(', ')}` }, { status: 400 });
    }

    const updatedMember = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

      const board = await tx.board.findUnique({
        where: { id: boardId },
        select: { createdById: true }
      });
      const isCreator = board?.createdById === targetUserId;
      if (!isCreator && currentMember.role === BoardMemberRole.ADMIN && newRole !== BoardMemberRole.ADMIN) {
        const adminCount = await tx.boardMember.count({
          where: {
            boardId: boardId,
            role: BoardMemberRole.ADMIN,
            status: { not: 'BANNED' },
            userId: { not: board?.createdById }
          }
        });
        if (adminCount < 1) {
          throw new Error("Cannot change the role of the last admin.");
        }
      }

      const memberUpdate = await tx.boardMember.update({
        where: {
          userId_boardId: { userId: targetUserId, boardId: boardId },
        },
        data: {
          role: newRole as BoardMemberRole,
        },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } }
        }
      });

      await recordAuditLog(
        tx,
        boardId,
        null,
        'UPDATE_BOARD_MEMBER_ROLE',
        'USER',
        targetUserId,
        { oldRole: currentMember.role, newRole: memberUpdate.role },
        requestingUserId
      );

      return memberUpdate;
    });

    return NextResponse.json(updatedMember, { status: 200 });

  } catch (error: any) {
    console.error("Error changing board member role:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: "Member not found." }, { status: 404 });
    }
    if (error.message.includes("Target user is not a member") || error.message.includes("Cannot change the role of a banned member")) {
        return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error.message.includes("Cannot change the role of the last admin")) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to change board member role." }, { status: 500 });
  }
}
