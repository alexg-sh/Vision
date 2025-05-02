import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@prisma/client";

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

export async function PATCH(req: Request, { params }: { params: { id: string; memberId: string } }) {
  const session = await getServerSession(authOptions);
  const organizationId = params.id;
  const targetUserId = params.memberId;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const requestingUserId = session.user.id;

  const requestingUserRole = await getUserRole(requestingUserId, organizationId);
  if (requestingUserRole !== 'ADMIN') {
    return NextResponse.json({ message: "Forbidden: Only admins can modify member roles or status." }, { status: 403 });
  }

  if (requestingUserId === targetUserId) {
    return NextResponse.json({ message: "Forbidden: Admins cannot modify their own role or status here." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { role, status, banReason } = body;

    if (role && ['ADMIN', 'MEMBER'].includes(role)) {
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
      return NextResponse.json(updatedMember, { status: 200 });
    }

    if (status && ['ACTIVE', 'BANNED'].includes(status)) {
      if (status === 'BANNED') {
        const targetMember = await prisma.organizationMember.findUnique({
          where: { userId_organizationId: { userId: targetUserId, organizationId: organizationId } },
          select: { role: true },
        });

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
            prisma.organizationBan.upsert({
              where: {
                userId_organizationId: { userId: targetUserId, organizationId: organizationId },
              },
              update: {
                banReason: typeof banReason === 'string' ? banReason : null,
                bannedBy: requestingUserId,
                bannedAt: new Date(),
              },
              create: {
                userId: targetUserId,
                organizationId: organizationId,
                banReason: typeof banReason === 'string' ? banReason : null,
                bannedBy: requestingUserId,
                bannedAt: new Date(),
              },
            }),
            prisma.organizationMember.deleteMany({
              where: {
                userId: targetUserId,
                organizationId: organizationId,
              },
            }),
          ]);

          return NextResponse.json({ message: "User banned and removed successfully." }, { status: 200 });

        } catch (error: any) {
           if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return NextResponse.json({ message: "User banned successfully (was already removed)." }, { status: 200 });
           }
           throw error;
        }

      } else {
        await prisma.organizationBan.deleteMany({
          where: {
            userId: targetUserId,
            organizationId: organizationId,
          },
        });


        return NextResponse.json({ message: "User unbanned successfully. They can rejoin the organization." }, { status: 200 });
      }
    }

    return NextResponse.json({ message: "Invalid request. Provide 'role' or 'status' ('ACTIVE'/'BANNED')." }, { status: 400 });

  } catch (error: any) {
    console.error("Error updating organization member:", error);
    if (error.code === 'P2025') {
        return NextResponse.json({ message: "Member not found." }, { status: 404 });
    }
    return NextResponse.json({ message: "Failed to update organization member." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string; memberId: string } }) {
  const session = await getServerSession(authOptions);
  const organizationId = params.id;
  const targetUserId = params.memberId;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const requestingUserId = session.user.id;

  const requestingUserRole = await getUserRole(requestingUserId, organizationId);
  const isSelfRemoval = requestingUserId === targetUserId;

  if (!isSelfRemoval && requestingUserRole !== 'ADMIN') {
    return NextResponse.json({ message: "Forbidden: Only admins can remove other members." }, { status: 403 });
  }

  try {
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

    await prisma.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: organizationId,
        },
      },
    });


    const message = isSelfRemoval ? "Successfully left the organization." : "Member removed successfully.";
    return NextResponse.json({ message: message }, { status: 200 });
  } catch (error: any) {
    console.error("Error removing organization member:", error);
    return NextResponse.json({ message: "Failed to remove organization member." }, { status: 500 });
  }
}
