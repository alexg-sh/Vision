import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path as needed
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

// Define InviteStatus enum if not already globally available via Prisma generate
enum InviteStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    DECLINED = "DECLINED",
    EXPIRED = "EXPIRED" // Optional
}

// Helper function to check user's role (Consider moving to a shared lib/permissions.ts)
async function getUserRoleInOrg(userId: string, organizationId: string): Promise<string | null> {
  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { role: true, status: true },
  });
  // Only return role if the member is active
  return member?.status === 'ACTIVE' ? member.role : null;
}

async function getUserRoleInBoard(userId: string, boardId: string): Promise<string | null> {
    // First, check direct board membership (if you implement BoardMember model)
    // const boardMember = await prisma.boardMember.findUnique({ ... });
    // if (boardMember) return boardMember.role;

    // If no direct board membership, check organization membership for the board's org
    const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { organizationId: true }
    });

    if (!board?.organizationId) {
        // Handle boards not linked to an organization (e.g., personal boards)
        // Check if the user is the creator? Adjust logic as needed.
        const boardCreator = await prisma.board.findFirst({
            where: { id: boardId, createdById: userId },
            select: { id: true }
        });
        return boardCreator ? 'ADMIN' : null; // Example: Creator is admin
    }

    // Board belongs to an organization, check org role
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
    const { username, organizationId, boardId } = body; // Expect username instead of email

    // --- Validation ---
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return NextResponse.json({ message: "Username is required" }, { status: 400 });
    }
    if (!organizationId && !boardId) {
      return NextResponse.json({ message: "Either organizationId or boardId is required" }, { status: 400 });
    }
    if (organizationId && boardId) {
      return NextResponse.json({ message: "Cannot invite to both an organization and a board simultaneously" }, { status: 400 });
    }

    // --- Find Invited User by Username ---
    const invitedUser = await prisma.user.findUnique({
      where: { username: username.trim() }, // Find by username
      select: { id: true, name: true, email: true } // Select necessary fields
    });

    if (!invitedUser) {
      return NextResponse.json({ message: `User with username '${username}' not found.` }, { status: 404 });
    }

    // Prevent self-invitation
    if (invitedUser.id === inviterId) {
        return NextResponse.json({ message: "You cannot invite yourself." }, { status: 400 });
    }

    // --- Authorization Check ---
    let targetName = "";
    let canInviterInvite = false;

    if (organizationId) {
      const inviterRole = await getUserRoleInOrg(inviterId, organizationId);
      // Allow ADMIN or MODERATOR to invite (adjust roles as needed)
      canInviterInvite = inviterRole === 'ADMIN' || inviterRole === 'MODERATOR';
      const organization = await prisma.organization.findUnique({ where: { id: organizationId }, select: { name: true } });
      if (!organization) return NextResponse.json({ message: "Organization not found" }, { status: 404 });
      targetName = organization.name;
    } else if (boardId) {
      const inviterRole = await getUserRoleInBoard(inviterId, boardId);
      // Allow ADMIN or MODERATOR to invite (adjust roles as needed)
      // Or allow any member if board allows member invites (add board setting if needed)
      canInviterInvite = inviterRole === 'ADMIN' || inviterRole === 'MODERATOR'; // Example logic
      const board = await prisma.board.findUnique({ where: { id: boardId }, select: { name: true } });
      if (!board) return NextResponse.json({ message: "Board not found" }, { status: 404 });
      targetName = board.name;
    }

    if (!canInviterInvite) {
      return NextResponse.json({ message: "You do not have permission to invite members to this resource." }, { status: 403 });
    }

    // --- Check Existing Membership/Ban Status ---
    if (organizationId) {
      const existingMember = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: invitedUser.id, organizationId } },
        select: { status: true } // Only need status
      });
      // Prevent inviting if already an active member or banned
      if (existingMember) {
          if (existingMember.status === 'ACTIVE') {
              return NextResponse.json({ message: `User '${username}' is already a member of this organization.` }, { status: 409 });
          } else if (existingMember.status === 'BANNED') {
              return NextResponse.json({ message: `User '${username}' is banned from this organization.` }, { status: 409 });
          }
          // Potentially handle other statuses if they exist
      }
    } else if (boardId) {
      // Check board membership (direct or via org)
      const boardRole = await getUserRoleInBoard(invitedUser.id, boardId);
      if (boardRole) { // Assumes getUserRoleInBoard returns null if not a member or banned
           // Check if banned specifically (if getUserRoleInBoard doesn't distinguish)
           // This might require a more specific check depending on how roles/bans are structured
           // For now, assume any role means they are already involved.
           return NextResponse.json({ message: `User '${username}' is already involved with this board (directly or via organization).` }, { status: 409 });
      }
       // Add specific ban check for the board if necessary
    }

    // --- Check for Existing Pending Invite ---
     const existingPendingInvite = await prisma.invite.findFirst({
        where: {
            invitedUserId: invitedUser.id, // Check by invited user ID
            status: InviteStatus.PENDING, // Use enum
            ...(organizationId ? { organizationId: organizationId } : {}),
            ...(boardId ? { boardId: boardId } : {}),
        }
     });

     if (existingPendingInvite) {
         // Maybe update the timestamp? For now, just inform the inviter.
         return NextResponse.json({ message: `An invitation is already pending for user '${username}' for this resource.` }, { status: 409 });
     }


    // --- Create Invite & Notification ---
    // Use a transaction to ensure both invite and notification are created or neither
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const invite = await tx.invite.create({
          data: {
            invitedUsername: username.trim(), // Store the username used for the invite
            invitedUserId: invitedUser.id, // Link directly to the user ID
            invitedById: inviterId,
            organizationId: organizationId || undefined,
            boardId: boardId || undefined,
            status: InviteStatus.PENDING, // Use enum
          },
          include: {
            invitedBy: { select: { name: true } } // Include inviter's name for notification content
          }
        });

        // Create notification for the invited user.
        await tx.notification.create({
          data: {
            userId: invitedUser.id, // Directly link notification to the invited user
            type: "INVITE",
            // Use inviter's name from the included relation
            content: `${invite.invitedBy?.name || 'Someone'} invited you (${invitedUser.name || username}) to join ${targetName}.`,
            link: `/notifications`, // Link to notifications page where they can accept/decline
            inviteId: invite.id, // Link notification to the invite
            // Optional: Add inviterId, organizationId, boardId if needed for context in notification UI
            inviterId: inviterId,
            organizationId: organizationId || undefined,
            boardId: boardId || undefined,
          },
        });

        return invite; // Return the created invite from the transaction
    }); // End Transaction


    return NextResponse.json({ message: `Invitation sent successfully to ${invitedUser.name || username}`, inviteId: result.id }, { status: 201 });

  } catch (error: any) {
    console.error("Error sending invitation:", error);
     // Handle potential Prisma errors like unique constraint violation if the check failed somehow
    if (error.code === 'P2002') {
        // More specific message based on constraints if possible
        return NextResponse.json({ message: "An invitation conflict occurred. The user might already be a member or have a pending invite." }, { status: 409 });
    }
    // Handle specific errors thrown within the try block
    if (error.message.includes("not found") || error.message.includes("required")) {
        return NextResponse.json({ message: error.message }, { status: 400 }); // Bad Request for validation errors
    }
     if (error.message.includes("permission")) {
        return NextResponse.json({ message: error.message }, { status: 403 }); // Forbidden
    }

    return NextResponse.json({ message: "Internal Server Error sending invitation." }, { status: 500 });
  }
}

// GET handler (optional - for fetching invites, e.g., for the current user)
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        // Fetch pending invites for the logged-in user
        const pendingInvites = await prisma.invite.findMany({
            where: {
                invitedUserId: userId,
                status: InviteStatus.PENDING,
            },
            include: {
                invitedBy: { select: { name: true, image: true } }, // Get inviter's name and image
                organization: { select: { name: true, id: true } }, // Get organization details if applicable
                board: { select: { name: true, id: true } }, // Get board details if applicable
            },
            orderBy: {
                createdAt: 'desc', // Show newest invites first
            },
        });

        return NextResponse.json(pendingInvites, { status: 200 });

    } catch (error) {
        console.error("Error fetching invites:", error);
        return NextResponse.json({ message: "Internal Server Error fetching invites." }, { status: 500 });
    }
}
