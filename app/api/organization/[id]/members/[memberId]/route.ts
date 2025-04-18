import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@prisma/client"; // Import Prisma namespace for error types

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

// PATCH handler to update member role or status (ban/unban)
export async function PATCH(req: Request, { params }: { params: { id: string; memberId: string } }) {
  const session = await getServerSession(authOptions);
  const organizationId = params.id;
  const targetUserId = params.memberId; // The ID of the user whose membership is being modified

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const requestingUserId = session.user.id;

  // Check if the requesting user is an admin
  const requestingUserRole = await getUserRole(requestingUserId, organizationId);
  if (requestingUserRole !== 'ADMIN') {
    return NextResponse.json({ message: "Forbidden: Only admins can modify member roles or status." }, { status: 403 });
  }

  // Prevent admin from modifying their own role/status via this endpoint
  if (requestingUserId === targetUserId) {
    return NextResponse.json({ message: "Forbidden: Admins cannot modify their own role or status here." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { role, status, banReason } = body;

    // --- Handle Role Change ---
    if (role && ['ADMIN', 'MEMBER'].includes(role)) {
      // Check if trying to remove the last admin by changing their role
      const targetMember = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: targetUserId, organizationId: organizationId } },
        select: { role: true },
      });
      if (targetMember?.role === 'ADMIN' && role !== 'ADMIN') {
        const adminCount = await prisma.organizationMember.count({
          where: { organizationId: organizationId, role: 'ADMIN' },
        });
        if (adminCount <= 1) {
          return NextResponse.json({ message: "Cannot change the role of the last admin." }, { status: 400 });
        }
      }

      const updatedMember = await prisma.organizationMember.update({
        where: {
          userId_organizationId: { userId: targetUserId, organizationId: organizationId },
        },
        data: { role: role },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      });
      // TODO: Add audit log for role change
      return NextResponse.json(updatedMember, { status: 200 });
    }

    // --- Handle Ban/Unban ---
    if (status && ['ACTIVE', 'BANNED'].includes(status)) {
      if (status === 'BANNED') {
        // BANNING: Create Ban Record + Delete Member Record
        const targetMember = await prisma.organizationMember.findUnique({
          where: { userId_organizationId: { userId: targetUserId, organizationId: organizationId } },
          select: { role: true },
        });

        // Prevent banning the last admin
        if (targetMember?.role === 'ADMIN') {
            const adminCount = await prisma.organizationMember.count({
              where: { organizationId: organizationId, role: 'ADMIN' },
            });
            if (adminCount <= 1) {
              return NextResponse.json({ message: "Cannot ban the last admin." }, { status: 400 });
            }
        }

        try {
          await prisma.$transaction([
            // 1. Create the ban record
            prisma.organizationBan.create({
              data: {
                userId: targetUserId,
                organizationId: organizationId,
                banReason: typeof banReason === 'string' ? banReason : null,
                bannedBy: requestingUserId, // Store who initiated the ban
                bannedAt: new Date(),
              },
            }),
            // 2. Delete the membership record (kick)
            prisma.organizationMember.delete({
              where: {
                userId_organizationId: { userId: targetUserId, organizationId: organizationId },
              },
            }),
          ]);

          // TODO: Add audit log for banning
          return NextResponse.json({ message: "User banned and removed successfully." }, { status: 200 });

        } catch (error: any) {
           // Handle potential race condition or if member was already removed
           if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             // Record to delete not found - maybe already kicked. Check if ban exists.
             const existingBan = await prisma.organizationBan.findUnique({
               where: { userId_organizationId: { userId: targetUserId, organizationId: organizationId } }
             });
             if (existingBan) {
               return NextResponse.json({ message: "User was already banned and removed." }, { status: 200 });
             } else {
               // If member doesn't exist AND ban doesn't exist, something is wrong or they were just kicked.
               // Try creating the ban record again outside the transaction.
               await prisma.organizationBan.upsert({
                 where: { userId_organizationId: { userId: targetUserId, organizationId: organizationId } },
                 update: { banReason: typeof banReason === 'string' ? banReason : null, bannedBy: requestingUserId, bannedAt: new Date() },
                 create: { userId: targetUserId, organizationId: organizationId, banReason: typeof banReason === 'string' ? banReason : null, bannedBy: requestingUserId, bannedAt: new Date() },
               });
               return NextResponse.json({ message: "User banned successfully (was likely already removed)." }, { status: 200 });
             }
           }
           // Re-throw other errors
           throw error;
        }

      } else { // status === 'ACTIVE' (UNBANNING)
        // UNBANNING: Delete Ban Record
        await prisma.organizationBan.deleteMany({ // Use deleteMany in case of duplicates, though unique constraint should prevent this
          where: {
            userId: targetUserId,
            organizationId: organizationId,
          },
        });

        // Optional: Re-add member immediately? For now, just unban. They can rejoin.
        // await prisma.organizationMember.create({ data: { userId: targetUserId, organizationId: organizationId, role: 'MEMBER', status: 'ACTIVE' }});

        // TODO: Add audit log for unbanning
        return NextResponse.json({ message: "User unbanned successfully. They can rejoin the organization." }, { status: 200 });
      }
    }

    // If neither role nor status was provided or valid
    return NextResponse.json({ message: "Invalid request. Provide 'role' or 'status' ('ACTIVE'/'BANNED')." }, { status: 400 });

  } catch (error: any) {
    console.error("Error updating organization member:", error);
    // Handle specific Prisma errors if needed
    if (error.code === 'P2025') { // Record to update/delete not found
        return NextResponse.json({ message: "Member not found." }, { status: 404 });
    }
    return NextResponse.json({ message: "Failed to update organization member." }, { status: 500 });
  }
}

// DELETE handler to remove (kick) a member
export async function DELETE(req: Request, { params }: { params: { id: string; memberId: string } }) {
  const session = await getServerSession(authOptions);
  const organizationId = params.id;
  const targetUserId = params.memberId; // The ID of the user being removed

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const requestingUserId = session.user.id;

  // Check if the requesting user is an admin OR if the user is removing themselves
  const requestingUserRole = await getUserRole(requestingUserId, organizationId);
  const isSelfRemoval = requestingUserId === targetUserId;

  if (!isSelfRemoval && requestingUserRole !== 'ADMIN') {
    return NextResponse.json({ message: "Forbidden: Only admins can remove other members." }, { status: 403 });
  }

  try {
    // Check if trying to remove/leave the last admin
    const targetMember = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: targetUserId, organizationId: organizationId } },
      select: { role: true },
    });

    if (targetMember?.role === 'ADMIN') {
      const adminCount = await prisma.organizationMember.count({
        where: { organizationId: organizationId, role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        return NextResponse.json({ message: "Cannot remove the last admin. Transfer ownership first." }, { status: 400 });
      }
    }

    // Delete the member
    await prisma.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: organizationId,
        },
      },
    });

    // TODO: Add audit log entry for member removal/leave

    const message = isSelfRemoval ? "Successfully left the organization." : "Member removed successfully.";
    return NextResponse.json({ message: message }, { status: 200 });
  } catch (error: any) {
    console.error("Error removing organization member:", error);
    return NextResponse.json({ message: "Failed to remove organization member." }, { status: 500 });
  }
}
