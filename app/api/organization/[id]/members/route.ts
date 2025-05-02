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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: organizationId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const userRole = await getUserRole(userId, organizationId);
  if (!userRole) {
      return NextResponse.json({ message: "Forbidden: You are not a member of this organization." }, { status: 403 });
  }

  try {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: organizationId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: [
        { status: 'asc' },
        { role: 'asc' },
        { user: { name: 'asc' } },
      ],
    });

    return NextResponse.json(members, { status: 200 });
  } catch (error: any) {
    console.error("Detailed error fetching organization members:", {
        organizationId: organizationId,
        errorMessage: error.message,
        errorStack: error.stack,
        errorCode: error.code,
        errorMeta: error.meta,
        error: error
    });
    return NextResponse.json({ message: "Failed to fetch organization members." }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: organizationId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized. Please log in to join." }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { isPrivate: true, name: true },
    });

    if (!organization) {
      return NextResponse.json({ message: "Organization not found." }, { status: 404 });
    }

    if (organization.isPrivate) {
      return NextResponse.json({ message: "Cannot join a private organization directly. Look for an invite." }, { status: 403 });
    }

    const existingBan = await prisma.organizationBan.findUnique({
      where: {
        userId_organizationId: {
          userId: userId,
          organizationId: organizationId,
        },
      },
      select: { banReason: true, bannedAt: true }
    });

    if (existingBan) {
      return NextResponse.json({
        message: "You are banned from this organization and cannot join.",
        banDetails: {
          reason: existingBan.banReason || "No reason provided.",
          bannedAt: existingBan.bannedAt?.toISOString() || "N/A",
          appealInfo: "Please contact the organization staff to appeal this ban."
        }
      }, { status: 403 });
    }

    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: userId,
          organizationId: organizationId,
        },
      },
      select: { status: true, banReason: true, bannedAt: true }
    });

    if (existingMember) {
      if (existingMember.status === 'BANNED') {
        return NextResponse.json({
          message: "You are banned from this organization and cannot rejoin.",
          banDetails: {
            reason: existingMember.banReason || "No reason provided.",
            bannedAt: existingMember.bannedAt?.toISOString() || "N/A",
            appealInfo: "Please contact the organization staff or support to appeal this ban."
          }
        }, { status: 403 });
      } else {
        return NextResponse.json({ message: "You are already a member of this organization." }, { status: 409 });
      }
    }

    const newMember = await prisma.organizationMember.create({
      data: {
        userId: userId,
        organizationId: organizationId,
        role: 'MEMBER',
        status: 'ACTIVE',
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } }
      }
    });

    return NextResponse.json({ message: `Successfully joined ${organization.name}!`, member: newMember }, { status: 201 });

  } catch (error: any) {
    console.error("Error joining organization:", {
      organizationId: organizationId,
      userId: userId,
      errorMessage: error.message,
      errorStack: error.stack,
      errorCode: error.code,
      error: error
    });

    if (error.code === 'P2002') {
       const conflictingMember = await prisma.organizationMember.findUnique({
         where: { userId_organizationId: { userId: userId, organizationId: organizationId } },
         select: { status: true, banReason: true, bannedAt: true }
       });
       if (conflictingMember?.status === 'BANNED') {
         return NextResponse.json({
           message: "You are banned from this organization and cannot rejoin.",
           banDetails: {
             reason: conflictingMember.banReason || "No reason provided.",
             bannedAt: conflictingMember.bannedAt?.toISOString() || "N/A",
             appealInfo: "Please contact the organization staff or support to appeal this ban."
           }
         }, { status: 403 });
       } else {
         return NextResponse.json({ message: "You are already a member of this organization." }, { status: 409 });
       }
    }

    return NextResponse.json({ message: "Failed to join organization due to a server error." }, { status: 500 });
  }
}
