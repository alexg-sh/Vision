import { NextResponse } from "next/server";
// Import Prisma namespace from @prisma/client
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma"; // Keep prisma instance import
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// PATCH handler to accept or decline an invitation
export async function PATCH(req: Request, { params }: { params: { inviteId: string } }) {
  const session = await getServerSession(authOptions);
  const { inviteId } = params;
  // Expect string status
  const { status } = await req.json() as { status: "ACCEPTED" | "DECLINED" };

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  if (!inviteId) {
    return NextResponse.json({ message: "Invite ID is required" }, { status: 400 });
  }

  // Use string literals for status validation
  if (!status || (status !== "ACCEPTED" && status !== "DECLINED")) {
      return NextResponse.json({ message: "Invalid status provided. Must be ACCEPTED or DECLINED." }, { status: 400 });
  }

  try {
    // 1. Find the invite and verify the user is the intended recipient
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
      include: {
        organization: { select: { id: true, name: true } }, // Include org details if it's an org invite
        board: { select: { id: true, name: true, organizationId: true } }, // Include board details if it's a board invite
      },
    });

    if (!invite) {
      return NextResponse.json({ message: "Invite not found" }, { status: 404 });
    }

    // Verify the logged-in user is the one invited by checking the linked invitedUserId.
    // The signup process now links invites to users by username.
    // If invitedUserId is null, it means the invite wasn't properly linked or is invalid.
    if (invite.invitedUserId !== userId) {
       return NextResponse.json({ message: "You are not authorized to respond to this invite" }, { status: 403 });
    }

    // Use string literal for status check
    if (invite.status !== "PENDING") {
        return NextResponse.json({ message: `Invite has already been ${invite.status.toLowerCase()}` }, { status: 409 }); // Conflict
    }

    // --- Transaction for Atomicity ---
    // Remove explicit type annotation for tx, let TypeScript infer it
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 2. Update the Invite status
      const updatedInvite = await tx.invite.update({
        where: { id: inviteId },
        data: {
          status: status, // status is already "ACCEPTED" or "DECLINED"
        },
      });

      // 3. If ACCEPTED, add the user to the corresponding entity (Org or Board)
      if (status === "ACCEPTED") {
        if (invite.organizationId) {
          // Add to Organization
          // Check if member already exists (e.g., was previously removed but not banned)
          const existingMember = await tx.organizationMember.findUnique({
            where: { userId_organizationId: { userId: userId, organizationId: invite.organizationId } },
          });

          if (existingMember) {
            // If exists and is BANNED, prevent re-joining via invite acceptance
            if (existingMember.status === 'BANNED') {
                 throw new Error("Cannot accept invite: User is banned from this organization.");
            }
            // If exists and INACTIVE (e.g., left), reactivate? Or just update role? Assuming reactivation.
            await tx.organizationMember.update({
                where: { userId_organizationId: { userId: userId, organizationId: invite.organizationId } },
                data: { status: 'ACTIVE', role: 'MEMBER' }, // Default role, adjust as needed
            });
          } else {
            // Create new membership
            await tx.organizationMember.create({
              data: {
                userId: userId,
                organizationId: invite.organizationId,
                role: 'MEMBER', // Default role for accepted invite
                status: 'ACTIVE',
              },
            });
          }
          // TODO: Optionally create an audit log entry for joining via invite

        } else if (invite.boardId) {
          // Add to Board (Requires BoardMember model)
          // Similar logic: check if exists, handle banned/inactive, create if new
          // Example (assuming BoardMember model exists):
          /*
          const existingBoardMember = await tx.boardMember.findUnique({ ... });
          if (existingBoardMember) { ... }
          else {
              await tx.boardMember.create({
                  data: {
                      userId: userId,
                      boardId: invite.boardId,
                      role: 'VIEWER', // Default role
                  },
              });
          }
          */
         console.warn(`Board invite acceptance logic not fully implemented for boardId: ${invite.boardId}`);
         // For now, just accept the invite status update
        }
      }

      // 4. Optionally, update the related notification (e.g., mark as read or change content)
      // Find the notification linked to this invite
      const notification = await tx.notification.findUnique({
          where: { inviteId: inviteId }
      });
      if (notification) {
          await tx.notification.update({
              where: { id: notification.id },
              // Mark as read and potentially update content to reflect action
              data: {
                  read: true,
                  content: `You ${status.toLowerCase()} the invitation to join ${invite.organization?.name || invite.board?.name || 'the entity'}.`
              }
          });
      }

      return updatedInvite;
    }); // End Transaction

    const successMessage = status === "ACCEPTED" ? "Invitation accepted successfully." : "Invitation declined.";
    return NextResponse.json({ message: successMessage, invite: result }, { status: 200 });

  } catch (error: any) {
    console.error("Error processing invitation:", error);
     // Check if it's the specific error thrown in the transaction
    if (error.message.includes("Cannot accept invite: User is banned")) {
        return NextResponse.json({ message: error.message }, { status: 403 }); // Forbidden
    }
    return NextResponse.json({ message: "Internal Server Error processing invitation." }, { status: 500 });
  }
}
