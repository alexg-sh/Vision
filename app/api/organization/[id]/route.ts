import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getMembershipStatus } from "@/lib/permissions";

async function isOrgAdmin(userId: string, organizationId: string): Promise<boolean> {
  console.log(`Checking admin status for userId: ${userId} in organizationId: ${organizationId}`);
  const member = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: userId,
        organizationId: organizationId,
      },
    },
    select: { role: true, status: true },
  });
  console.log(`Found member record:`, member);
  const isAdmin = member?.role === 'ADMIN';
  console.log(`Is admin? ${isAdmin}`);
  return isAdmin;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: organizationId } = await params;
  console.log(`[API GET /organization/:id] Received organizationId: ${organizationId}`);
  const session = await getServerSession(authOptions);
  console.log(`GET /api/organization/[id] session userId: ${session?.user?.id}, organizationId: ${organizationId}`);

  if (!session?.user?.id) {
    try {
      console.log(`[API GET /organization/:id] Unauthenticated user. Querying for public org ID: ${organizationId}`);
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId, isPrivate: false },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          description: true,
          isPrivate: true,
          createdAt: true,
        },
      });
      console.log(`[API GET /organization/:id] Unauthenticated user. Prisma result:`, organization);
      if (!organization) {
        return NextResponse.json({ message: "Organization not found or is private." }, { status: 404 });
      }
      return NextResponse.json(organization, { status: 200 });
    } catch (error) {
      console.error("Error fetching public organization details:", error);
      return NextResponse.json({ message: "Failed to fetch organization details." }, { status: 500 });
    }
  }

  const userId = session.user.id;

  const member = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: userId,
        organizationId: organizationId,
      },
    },
    select: { role: true },
  });
  console.log(`Membership record for user ${userId}:`, member);

  try {
    console.log(`[API GET /organization/:id] Authenticated user ${userId}. Querying for org ID: ${organizationId}`);
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: { select: { members: true, boards: true } },
      },
    });
    console.log(`[API GET /organization/:id] Authenticated user. Prisma result:`, organization);

    if (!organization) {
      return NextResponse.json({ message: "Organization not found." }, { status: 404 });
    }

    if (organization.isPrivate && !member) {
      return NextResponse.json({ message: "Forbidden: You do not have access to this private organization." }, { status: 403 });
    }

    const organizationWithRole = {
      ...organization,
      userRole: member?.role || null,
    };

    return NextResponse.json(organizationWithRole, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching organization details:", error);
    return NextResponse.json({ message: "Failed to fetch organization details." }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: organizationId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const membershipStatus = await getMembershipStatus(userId, organizationId);
  if (!membershipStatus.isAdmin) {
    return NextResponse.json({ message: "Forbidden: Only admins can update organization settings." }, { status: 403 });
  }
  if (membershipStatus.isBanned) {
      return NextResponse.json({ message: "Forbidden: You are banned from this organization." }, { status: 403 });
  }

  let body: any = null;
  try {
    body = await req.json();

    const updateData: { name?: string; description?: string | null; imageUrl?: string | null; isPrivate?: boolean } = {};

    if (typeof body.name === 'string' && body.name.trim()) {
      updateData.name = body.name.trim();
    }
    if (typeof body.description === 'string') {
      updateData.description = body.description;
    }
    if (typeof body.imageUrl === 'string') {
      updateData.imageUrl = body.imageUrl;
    }
    if (typeof body.isPrivate === 'boolean') {
      updateData.isPrivate = body.isPrivate;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No valid fields provided for update." }, { status: 400 });
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
      include: {
        _count: { select: { members: true, boards: true } },
      }
    });

    const responseWithRole = {
      ...updatedOrganization,
      userRole: membershipStatus.role
    };


    return NextResponse.json(responseWithRole, { status: 200 });

  } catch (error: any) {
    console.error("Error updating organization:", error);
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to update organization." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: organizationId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const isAdmin = await isOrgAdmin(userId, organizationId);
  if (!isAdmin) {
    return NextResponse.json({ message: "Forbidden: Only admins can delete the organization." }, { status: 403 });
  }

  try {
    await prisma.organization.delete({
      where: { id: organizationId },
    });


    return NextResponse.json({ message: "Organization deleted successfully." }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting organization:", error);
    return NextResponse.json({ message: "Failed to delete organization." }, { status: 500 });
  }
}
