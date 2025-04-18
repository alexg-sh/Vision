import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

  const isMember = !!member;
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
