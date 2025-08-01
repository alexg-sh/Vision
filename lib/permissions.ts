import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from '@prisma/client'; // Import necessary types

// Define enums for BoardMemberRole and BoardMemberStatus if not generated by Prisma
export enum BoardMemberRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
  // Add other roles as needed
}

export enum BoardMemberStatus {
  ACTIVE = "ACTIVE",
  BANNED = "BANNED",
  // Add other statuses as needed
}

export type MembershipStatusResult = {
  role: string | null;
  status: string | null; // e.g., ACTIVE, BANNED
  isMember: boolean;
  isBanned: boolean;
  isAdmin: boolean;
  isModerator?: boolean; // Optional: Add if you have moderator roles
};

/**
 * Fetches the membership details for a user within an organization.
 * @param userId The ID of the user.
 * @param organizationId The ID of the organization.
 * @returns An object containing the user's role, status, and boolean checks.
 */
export async function getMembershipStatus(userId: string, organizationId: string): Promise<MembershipStatusResult> {
  if (!userId || !organizationId) {
    // Return guest status if IDs are invalid
    return { role: null, status: null, isMember: false, isBanned: false, isAdmin: false };
  }

  const member = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: userId,
        organizationId: organizationId,
      },
    },
    select: { role: true, status: true },
  });

  const isMember = !!member && member.status === 'ACTIVE'; // Check for ACTIVE status
  const isBanned = member?.status === 'BANNED';
  const role = member?.role || null;
  const isAdmin = role === 'ADMIN';
  // const isModerator = role === 'MODERATOR'; // Example if moderator role exists

  return {
    role,
    status: member?.status || null,
    isMember,
    isBanned,
    isAdmin,
    // isModerator,
  };
}

/**
 * API route helper to enforce that the user is an active (not banned) member.
 * Returns a NextResponse with status 403 if not an active member, otherwise returns the membership details.
 */
export async function enforceActiveMembership(userId: string, organizationId: string): Promise<MembershipStatusResult | NextResponse> {
    const membership = await getMembershipStatus(userId, organizationId);

    if (!membership.isMember) {
        // You might want to check if the organization is public here for read-only access in some cases
        return NextResponse.json({ message: "Forbidden: You are not a member of this organization." }, { status: 403 });
    }

    if (membership.isBanned) {
         return NextResponse.json({ message: "Forbidden: You are banned from this organization." }, { status: 403 });
    }

    // User is an active member
    return membership;
}

/**
 * API route helper to enforce that the user is an active Admin.
 * Returns a NextResponse with status 403 if not an active admin, otherwise returns the membership details.
 */
export async function enforceAdminMembership(userId: string, organizationId: string): Promise<MembershipStatusResult | NextResponse> {
    const membership = await getMembershipStatus(userId, organizationId);

     if (!membership.isAdmin) {
         return NextResponse.json({ message: "Forbidden: Administrator privileges required." }, { status: 403 });
     }
     // Also check if banned, although an admin shouldn't normally be banned
     if (membership.isBanned) {
          return NextResponse.json({ message: "Forbidden: You are banned from this organization." }, { status: 403 });
     }
     // User is an active admin
     return membership;
}

// Optional: Add enforceModeratorMembership if needed

// --- Board Permissions ---

export type BoardMembershipStatusResult = {
  role: BoardMemberRole | null; // Use enum type
  status: BoardMemberStatus | null; // Use enum type
  isMember: boolean;
  isBanned: boolean;
  isAdmin: boolean;
  isModerator?: boolean; // Optional: Add if you have moderator roles
};

/**
 * Fetches the membership details for a user within a specific board.
 * Also checks if the user is the creator of the board.
 * @param userId The ID of the user.
 * @param boardId The ID of the board.
 * @returns An object containing the user's role, status, and boolean checks.
 */
export async function getBoardMembershipStatus(userId: string, boardId: string): Promise<BoardMembershipStatusResult> {
  if (!userId || !boardId) {
    return { role: null, status: null, isMember: false, isBanned: false, isAdmin: false };
  }

  // Fetch both the member record and the board creator ID in parallel
  const [member, board] = await Promise.all([
    prisma.boardMember.findUnique({
      where: {
        userId_boardId: {
          userId: userId,
          boardId: boardId,
        },
      },
      select: { role: true, status: true },
    }),
    prisma.board.findUnique({
      where: { id: boardId },
      select: { createdById: true },
    })
  ]);

  const isCreator = !!board && board.createdById === userId;
  const isMember = !!member;
  const isBanned = member?.status === BoardMemberStatus.BANNED; // Use enum
  // User is admin if their role is ADMIN OR if they are the creator
  const isAdmin = (member?.role as BoardMemberRole) === BoardMemberRole.ADMIN || isCreator; // Use enum
  // const isModerator = member?.role === 'MODERATOR'; // Example if moderator role exists

  return {
    role: member?.role as BoardMemberRole ?? null,
    status: member?.status ? member.status as BoardMemberStatus : null,
    isMember,
    isBanned,
    isAdmin,
    // isModerator,
  };
}

/**
 * API route helper to enforce that the user is an active (not banned) member of a board.
 * Returns a NextResponse with status 403 if not an active member, otherwise returns the membership details.
 */
export async function enforceActiveBoardMembership(userId: string, boardId: string): Promise<BoardMembershipStatusResult | NextResponse> {
    const membership = await getBoardMembershipStatus(userId, boardId);

    if (!membership.isMember && !(await prisma.board.findFirst({ where: { id: boardId, createdById: userId } }))) { // Also check if creator
        // Consider if public boards allow read-only access
        return NextResponse.json({ message: "Forbidden: You are not a member of this board." }, { status: 403 });
    }

    if (membership.isBanned) {
         return NextResponse.json({ message: "Forbidden: You are banned from this board." }, { status: 403 });
    }

    // User is an active board member or the creator
    return membership;
}

/**
 * Enforces that the requesting user is an active admin member of the specified board OR the board creator.
 * Returns a NextResponse with a 403 Forbidden status if the user is not an admin or is banned.
 * Returns null if the user is an authorized admin.
 * @param requestingUserId The ID of the user making the request.
 * @param boardId The ID of the board.
 * @returns NextResponse | null
 */
export async function enforceBoardAdminMembership(
  requestingUserId: string,
  boardId: string
): Promise<NextResponse | null> {
  try {
    // Fetch both the board details (for creator check) and the membership status in one query
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: {
        createdById: true,
        members: {
          where: { userId: requestingUserId },
          select: { role: true, status: true },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ message: "Board not found." }, { status: 404 });
    }

    const member = board.members[0];
    const isCreator = board.createdById === requestingUserId;
    const isExplicitAdmin = member?.role === BoardMemberRole.ADMIN;
    const isExplicitModerator = member?.role === 'MODERATOR';
    const isActiveMember = member?.status === BoardMemberStatus.ACTIVE;

    // Grant access if the user is the creator OR an active admin/moderator member
    if (isCreator || ((isExplicitAdmin || isExplicitModerator) && isActiveMember)) {
      return null; // Authorized
    }

    if (member && member.status === BoardMemberStatus.BANNED) {
      return NextResponse.json({ message: "Forbidden: You are banned from this board." }, { status: 403 });
    }

    return NextResponse.json(
      { message: "Forbidden: Board administrator or moderator privileges required." },
      { status: 403 }
    );

  } catch (error) {
    console.error("Error enforcing board admin/moderator membership:", error);
    return NextResponse.json({ message: "Internal server error during permission check." }, { status: 500 });
  }
}

/**
 * Get the membership status of a user for a specific organization.
 * Returns whether the user is a member, is banned, and the user's role.
 */
export async function getOrganizationMembershipStatus(
  userId: string,
  organizationId: string
): Promise<{ isMember: boolean; isBanned: boolean; role: string }> {
  if (!userId) return { isMember: false, isBanned: false, role: 'guest' }
  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { role: true, status: true }
  })
  const isMember = !!member && member.status === 'ACTIVE'
  const isBanned = !!member && member.status !== 'ACTIVE'
  return {
    isMember,
    isBanned,
    role: member?.role?.toLowerCase() ?? 'guest'
  }
}

/**
 * Get the role of a user in a specific board.
 * First checks direct board membership, then organization membership if applicable.
 * @param userId The ID of the user.
 * @param boardId The ID of the board.
 * @returns The role of the user in the board, or null if no role is found.
 */
export async function getUserRoleInBoard(userId: string, boardId: string): Promise<string | null> {
  // First, check direct board membership
  const boardMember = await prisma.boardMember.findUnique({
    where: { userId_boardId: { userId, boardId } },
    select: { role: true, status: true }
  });
  // Only return role if the member is active
  if (boardMember && boardMember.status === 'ACTIVE') {
    return boardMember.role;
  }

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

  // Check organization membership
  const organizationMembership = await getOrganizationMembershipStatus(userId, board.organizationId);
  return organizationMembership.isMember ? organizationMembership.role : null;
}
