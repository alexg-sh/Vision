import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await getServerSession(authOptions);
  const organizationId = params.id;
  const userIdToUnban = params.userId;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const requestingUserId = session.user.id;

  const requestingUserRole = await getUserRole(requestingUserId, organizationId);
  if (requestingUserRole !== 'ADMIN') {
    return NextResponse.json({ message: "Forbidden: Only admins can unban users." }, { status: 403 });
  }

  if (requestingUserId === userIdToUnban) {
      return NextResponse.json({ message: "Admins cannot unban themselves." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const deletedBan = await tx.organizationBan.deleteMany({
        where: {
          userId: userIdToUnban,
          organizationId: organizationId,
        },
      });

      const updatedMember = await tx.organizationMember.updateMany({
        where: {
          userId: userIdToUnban,
          organizationId: organizationId,
          status: 'BANNED',
        },
        data: {
          status: 'ACTIVE',
          banReason: null,
          bannedAt: null,
        },
      });

      if (deletedBan.count === 0 && updatedMember.count === 0) {
         throw new Error("User not found or was not banned.");
      }

      return { deletedBanCount: deletedBan.count, updatedMemberCount: updatedMember.count };
    });

    console.log(`Unban successful for user ${userIdToUnban} in org ${organizationId}. Ban records deleted: ${result.deletedBanCount}, Member records updated: ${result.updatedMemberCount}`);
    return NextResponse.json({ message: "User successfully unbanned." }, { status: 200 });

  } catch (error: any) {
    console.error(`Error unbanning user ${userIdToUnban} in org ${organizationId}:`, error);

    if (error.message === "User not found or was not banned.") {
        return NextResponse.json({ message: "User not found or was not banned in this organization." }, { status: 404 });
    }

    return NextResponse.json({ message: "Failed to unban user due to a server error." }, { status: 500 });
  }
}
