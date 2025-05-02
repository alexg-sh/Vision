import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { InviteStatus } from '@prisma/client';

export async function PATCH(req: Request, context: { params: Promise<{ inviteId: string }> }) {
  const session = await getServerSession(authOptions);
  const { inviteId } = await context.params;
  const { status: action } = await req.json() as { status: "ACCEPTED" | "DECLINED" };

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  if (!inviteId) {
    return NextResponse.json({ message: "Invite ID is required" }, { status: 400 });
  }

  if (!action || (action !== "ACCEPTED" && action !== "DECLINED")) {
      return NextResponse.json({ message: "Invalid status provided. Must be ACCEPTED or DECLINED." }, { status: 400 });
  }

  try {
    const initialInvite = await prisma.invite.findUnique({
      where: { id: inviteId },
      select: {
        id: true,
        status: true,
        invitedUserId: true,
        organizationId: true,
        boardId: true,
        organization: { select: { id: true, name: true } },
        board: { select: { id: true, name: true } },
      },
    });

    if (!initialInvite) {
      return NextResponse.json({ message: "Invite not found" }, { status: 404 });
    }

    if (initialInvite.invitedUserId !== userId) {
       return NextResponse.json({ message: "You are not authorized to respond to this invite" }, { status: 403 });
    }

    if (initialInvite.status !== InviteStatus.PENDING) {
        return NextResponse.json({ message: `Invite has already been ${initialInvite.status.toLowerCase()}` }, { status: 409 });
    }

    interface InviteDetails {
      id: string;
      status: InviteStatus;
      invitedUserId: string | null;
      organizationId: string | null;
      boardId: string | null;
      organization: { name: string } | null;
      board: { name: string } | null;
    }

    interface NotificationDetails {
      id: string;
      inviteId: string | null;
    }

    interface TransactionResult {
      action: "ACCEPTED" | "DECLINED";
    }

    const result: TransactionResult = await prisma.$transaction(async (tx: Prisma.TransactionClient): Promise<TransactionResult> => {
      const invite: InviteDetails | null = await tx.invite.findUnique({
        where: { id: inviteId },
        select: {
          id: true,
          status: true,
          invitedUserId: true,
          organizationId: true,
          boardId: true,
          organization: { select: { name: true } },
          board: { select: { name: true } },
        },
      });

      if (!invite) {
        throw new Error("Invite not found.");
      }
      if (invite.status !== InviteStatus.PENDING) {
        throw new Error("Invite has already been responded to.");
      }
      if (userId !== invite.invitedUserId) {
        throw new Error("Unauthorized or invite mismatch.");
      }

      const notification: NotificationDetails | null = await tx.notification.findUnique({
        where: { inviteId: inviteId },
      });

      if (notification) {
        await tx.notification.update({
          where: { id: notification.id },
          data: {
            read: true,
            content: `You ${action.toLowerCase()} the invitation to join ${invite.organization?.name || invite.board?.name || 'the entity'}.`,
          },
        });
      }

      if (action === "ACCEPTED") {
        if (invite.organizationId) {
          const existingMember = await tx.organizationMember.findUnique({
            where: { userId_organizationId: { userId: userId, organizationId: invite.organizationId } },
          });
          if (existingMember) {
            if (existingMember.status === 'BANNED') {
              throw new Error("Cannot accept invite: User is banned from this organization.");
            }
            await tx.organizationMember.update({
              where: { userId_organizationId: { userId: userId, organizationId: invite.organizationId } },
              data: { status: 'ACTIVE', role: 'MEMBER' },
            });
          } else {
            await tx.organizationMember.create({
              data: {
                userId: userId,
                organizationId: invite.organizationId,
                role: 'MEMBER',
                status: 'ACTIVE',
              },
            });
          }
        } else if (invite.boardId) {
          const boardExists = await tx.board.findUnique({
            where: { id: invite.boardId },
            select: { id: true },
          });

          if (!boardExists) {
            throw new Error(`Board with ID ${invite.boardId} not found.`);
          }

          const existingBoardMember = await tx.boardMember.findUnique({
            where: { userId_boardId: { userId: userId, boardId: invite.boardId } },
          });
          if (existingBoardMember) {
            await tx.boardMember.update({
              where: { userId_boardId: { userId: userId, boardId: invite.boardId } },
              data: { role: 'MEMBER' },
            });
          } else {
            await tx.boardMember.create({
              data: {
                userId: userId,
                boardId: invite.boardId,
                role: 'MEMBER',
              },
            });
          }
        } else {
          throw new Error("Invite is not associated with an organization or a board.");
        }

        await tx.invite.delete({
          where: { id: inviteId },
        });

      } else {
        await tx.invite.delete({
          where: { id: inviteId },
        });
      }

      return { action: action };
    });

    const successMessage = result.action === "ACCEPTED"
        ? "Invitation accepted successfully."
        : "Invitation declined successfully.";

    return NextResponse.json({ message: successMessage }, { status: 200 });

  } catch (error: any) {
    console.error("Error processing invitation:", error);
    if (error.message.includes("Cannot accept invite: User is banned")) {
        return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error.message.includes("Board with ID") && error.message.includes("not found")) {
        return NextResponse.json({ message: "Cannot accept invite: The associated board no longer exists." }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
         return NextResponse.json({ message: "Invite not found, already processed, or related entity missing." }, { status: 404 });
    }
    if (error.message === "Invite not found." || error.message === "Invite has already been responded to." || error.message === "Unauthorized or invite mismatch.") {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
     if (error.message === "Invite is not associated with an organization or a board.") {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal Server Error processing invitation." }, { status: 500 });
  }
}
