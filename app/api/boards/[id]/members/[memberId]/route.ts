import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { enforceBoardAdminMembership } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

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
  }
}


export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  const boardId = params.id;
  const targetUserId = params.memberId;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const requestingUserId = session.user.id;

  const permissionCheck = await enforceBoardAdminMembership(requestingUserId, boardId);
  if (permissionCheck instanceof NextResponse) {
    return permissionCheck;
  }

  if (requestingUserId === targetUserId) {
    return NextResponse.json({ message: 'Board admins cannot ban themselves.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { status, banReason } = body;

    if (status !== 'BANNED') {
      return NextResponse.json({ message: "Invalid status. Only 'BANNED' is supported via PATCH." }, { status: 400 });
    }

    const updatedMember = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
          user: { select: { id: true, name: true, email: true, image: true } }
        }
      });

      await recordAuditLog(
        tx,
        boardId,
        null,
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


export async function DELETE(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  const boardId = params.id;
  const targetUserId = params.memberId;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const requestingUserId = session.user.id;

  const permissionCheck = await enforceBoardAdminMembership(requestingUserId, boardId);
  if (permissionCheck instanceof NextResponse) {
    return permissionCheck;
  }

  if (requestingUserId === targetUserId) {
    return NextResponse.json({ message: 'Board admins cannot unban themselves.' }, { status: 400 });
  }

  try {
    const updatedMember = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
                user: { select: { id: true, name: true, email: true, image: true } }
            }
        });

        await recordAuditLog(
            tx,
            boardId,
            null,
            'UNBAN_BOARD_MEMBER',
            'USER',
            targetUserId,
            null,
            requestingUserId
        );

        return memberUpdate;
    });

     return NextResponse.json(updatedMember, { status: 200 });

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
