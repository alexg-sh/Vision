import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Helper function to check user's role in the organization
async function getUserRole(userId: string, organizationId: string): Promise<string | null> {
  const member = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: userId,
        organizationId: organizationId,
      },
    },
    select: { role: true },
  });
  return member?.role || null;
}

// DELETE handler to unban a user from an organization
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await getServerSession(authOptions);
  const organizationId = params.id;
  const userIdToUnban = params.userId;

  // 1. Check if the requesting user is authenticated
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const requestingUserId = session.user.id;

  // 2. Check if the requesting user is an admin of this organization
  const requestingUserRole = await getUserRole(requestingUserId, organizationId);
  if (requestingUserRole !== 'ADMIN') {
    return NextResponse.json({ message: "Forbidden: Only admins can unban users." }, { status: 403 });
  }

  // 3. Check if the user to unban is the admin themselves (admins shouldn't ban/unban themselves)
  if (requestingUserId === userIdToUnban) {
      return NextResponse.json({ message: "Admins cannot unban themselves." }, { status: 400 });
  }

  try {
    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // a. Attempt to find and delete from OrganizationBan table (if it exists)
      const deletedBan = await tx.organizationBan.deleteMany({
        where: {
          userId: userIdToUnban,
          organizationId: organizationId,
        },
      });

      // b. Attempt to find and update the OrganizationMember status
      const updatedMember = await tx.organizationMember.updateMany({
        where: {
          userId: userIdToUnban,
          organizationId: organizationId,
          status: 'BANNED', // Only update if currently banned
        },
        data: {
          status: 'ACTIVE', // Set back to active
          banReason: null, // Clear ban reason
          bannedAt: null, // Clear ban date
        },
      });

      // Check if *any* action was taken (either ban deleted or member updated)
      if (deletedBan.count === 0 && updatedMember.count === 0) {
        // If neither record was found/modified, the user wasn't banned in the first place
        // Throw an error to be caught by the outer catch block, resulting in a 404
         throw new Error("User not found or was not banned.");
      }

      return { deletedBanCount: deletedBan.count, updatedMemberCount: updatedMember.count };
    });

    console.log(`Unban successful for user ${userIdToUnban} in org ${organizationId}. Ban records deleted: ${result.deletedBanCount}, Member records updated: ${result.updatedMemberCount}`);
    return NextResponse.json({ message: "User successfully unbanned." }, { status: 200 });

  } catch (error: any) {
    console.error(`Error unbanning user ${userIdToUnban} in org ${organizationId}:`, error);

    // Handle the specific case where the user wasn't found/banned
    if (error.message === "User not found or was not banned.") {
        return NextResponse.json({ message: "User not found or was not banned in this organization." }, { status: 404 });
    }

    // Generic error for other issues
    return NextResponse.json({ message: "Failed to unban user due to a server error." }, { status: 500 });
  }
}
