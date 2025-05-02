import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

enum InviteStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    DECLINED = "DECLINED",
    EXPIRED = "EXPIRED"
}

async function getUserRoleInOrg(userId: string, organizationId: string): Promise<string | null> {
  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { role: true, status: true },
  });
  return member?.status === 'ACTIVE' ? member.role : null;
}

async function getUserRoleInBoard(userId: string, boardId: string): Promise<string | null> {

    const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { organizationId: true }
    });

    if (!board?.organizationId) {
        const boardCreator = await prisma.board.findFirst({
            where: { id: boardId, createdById: userId },
            select: { id: true }
        });
        return boardCreator ? 'ADMIN' : null;
    }

    return getUserRoleInOrg(userId, board.organizationId);
}


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const inviterId = session.user.id;

  try {
    const body = await req.json();
    const { username, organizationId, boardId } = body;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      return NextResponse.json({ message: "Username is required" }, { status: 400 });
    }
    if (!organizationId && !boardId) {
      return NextResponse.json({ message: "Either organizationId or boardId is required" }, { status: 400 });
    }
    if (organizationId && boardId) {
      return NextResponse.json({ message: "Cannot invite to both an organization and a board simultaneously" }, { status: 400 });
    }

    const invitedUser = await prisma.user.findUnique({
      where: { username: username.trim() },
      select: { id: true, name: true, email: true }
    });

    if (!invitedUser) {
      return NextResponse.json({ message: `User with username '${username}' not found.` }, { status: 404 });
    }

    if (invitedUser.id === inviterId) {
        return NextResponse.json({ message: "You cannot invite yourself." }, { status: 400 });
    }

    let targetName = "";
    let canInviterInvite = false;

    if (organizationId) {
      const inviterRole = await getUserRoleInOrg(inviterId, organizationId);
      canInviterInvite = inviterRole === 'ADMIN' || inviterRole === 'MODERATOR';
      const organization = await prisma.organization.findUnique({ where: { id: organizationId }, select: { name: true } });
      if (!organization) return NextResponse.json({ message: "Organization not found" }, { status: 404 });
      targetName = organization.name;
    } else if (boardId) {
      const inviterRole = await getUserRoleInBoard(inviterId, boardId);
      canInviterInvite = inviterRole === 'ADMIN' || inviterRole === 'MODERATOR';
      const board = await prisma.board.findUnique({ where: { id: boardId }, select: { name: true } });
      if (!board) return NextResponse.json({ message: "Board not found" }, { status: 404 });
      targetName = board.name;
    }

    if (!canInviterInvite) {
      return NextResponse.json({ message: "You do not have permission to invite members to this resource." }, { status: 403 });
    }

    if (organizationId) {
      const existingMember = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: invitedUser.id, organizationId } },
        select: { status: true }
      });
      if (existingMember) {
          if (existingMember.status === 'ACTIVE') {
              return NextResponse.json({ message: `User '${username}' is already a member of this organization.` }, { status: 409 });
          } else if (existingMember.status === 'BANNED') {
              return NextResponse.json({ message: `User '${username}' is banned from this organization.` }, { status: 409 });
          }
      }
    } else if (boardId) {
      const boardRole = await getUserRoleInBoard(invitedUser.id, boardId);
      if (boardRole) {
           return NextResponse.json({ message: `User '${username}' is already involved with this board (directly or via organization).` }, { status: 409 });
      }
    }

     const existingPendingInvite = await prisma.invite.findFirst({
        where: {
            invitedUserId: invitedUser.id,
            status: InviteStatus.PENDING,
            ...(organizationId ? { organizationId: organizationId } : {}),
            ...(boardId ? { boardId: boardId } : {}),
        }
     });

     if (existingPendingInvite) {
         return NextResponse.json({ message: `An invitation is already pending for user '${username}' for this resource.` }, { status: 409 });
     }


    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const invite = await tx.invite.create({
          data: {
            invitedUsername: username.trim(),
            invitedUserId: invitedUser.id,
            invitedById: inviterId,
            organizationId: organizationId || undefined,
            boardId: boardId || undefined,
            status: InviteStatus.PENDING,
          },
          include: {
            invitedBy: { select: { name: true } }
          }
        });

        await tx.notification.create({
          data: {
            userId: invitedUser.id,
            type: "INVITE",
            content: `${invite.invitedBy?.name || 'Someone'} invited you (${invitedUser.name || username}) to join ${targetName}.`,
            link: `/notifications`,
            inviteId: invite.id,
            inviterId: inviterId,
            organizationId: organizationId || undefined,
            boardId: boardId || undefined,
          },
        });

        return invite;
    });


    return NextResponse.json({ message: `Invitation sent successfully to ${invitedUser.name || username}`, inviteId: result.id }, { status: 201 });

  } catch (error: any) {
    console.error("Error sending invitation:", error);
    if (error.code === 'P2002') {
        return NextResponse.json({ message: "An invitation conflict occurred. The user might already be a member or have a pending invite." }, { status: 409 });
    }
    if (error.message.includes("not found") || error.message.includes("required")) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
     if (error.message.includes("permission")) {
        return NextResponse.json({ message: error.message }, { status: 403 });
    }

    return NextResponse.json({ message: "Internal Server Error sending invitation." }, { status: 500 });
  }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        const pendingInvites = await prisma.invite.findMany({
            where: {
                invitedUserId: userId,
                status: InviteStatus.PENDING,
            },
            include: {
                invitedBy: { select: { name: true, image: true } },
                organization: { select: { name: true, id: true } },
                board: { select: { name: true, id: true } },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(pendingInvites, { status: 200 });

    } catch (error) {
        console.error("Error fetching invites:", error);
        return NextResponse.json({ message: "Internal Server Error fetching invites." }, { status: 500 });
    }
}
