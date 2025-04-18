import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getMembershipStatus } from "@/lib/permissions"; // Add this import

// Helper function to check if user is an admin of the organization
async function isOrgAdmin(userId: string, organizationId: string): Promise<boolean> {
  console.log(`Checking admin status for userId: ${userId} in organizationId: ${organizationId}`);
  const member = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: userId,
        organizationId: organizationId,
      },
    },
    select: { role: true, status: true }, // Select status too for context
  });
  console.log(`Found member record:`, member);
  const isAdmin = member?.role === 'ADMIN';
  console.log(`Is admin? ${isAdmin}`);
  return isAdmin;
}

// GET handler to fetch organization details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: organizationId } = await params;
  const session = await getServerSession(authOptions);
  console.log(`GET /api/organization/[id] session userId: ${session?.user?.id}, organizationId: ${organizationId}`);

  if (!session?.user?.id) {
    // Allow fetching public org details even if not logged in
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId, isPrivate: false }, // Only public orgs
        // Select necessary fields for public view
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          description: true,
          isPrivate: true,
          createdAt: true,
          // Exclude sensitive data like members list for non-members
        },
      });
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

  // Check if the user is a member
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
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      // Include details needed for settings page
      include: {
        _count: { select: { members: true, boards: true } },
        // Add other relations if needed, but avoid fetching full members list here
        // Members list will be fetched separately via /api/organization/[id]/members
      },
    });

    if (!organization) {
      return NextResponse.json({ message: "Organization not found." }, { status: 404 });
    }

    // If the org is private and the user is not a member, deny access
    if (organization.isPrivate && !member) {
      return NextResponse.json({ message: "Forbidden: You do not have access to this private organization." }, { status: 403 });
    }

    // Add the requesting user's role to the response
    const organizationWithRole = {
      ...organization,
      userRole: member?.role || null, // null if user is not a member (only possible for public orgs)
    };

    return NextResponse.json(organizationWithRole, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching organization details:", error);
    return NextResponse.json({ message: "Failed to fetch organization details." }, { status: 500 });
  }
}

// PUT handler to update organization details
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: organizationId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if the user is an admin of this organization
  const membershipStatus = await getMembershipStatus(userId, organizationId); // Use getMembershipStatus
  if (!membershipStatus.isAdmin) { // Check isAdmin from the result
    return NextResponse.json({ message: "Forbidden: Only admins can update organization settings." }, { status: 403 });
  }
  // Also check if banned
  if (membershipStatus.isBanned) {
      return NextResponse.json({ message: "Forbidden: You are banned from this organization." }, { status: 403 });
  }

  let body: any = null; // Initialize body to null
  try {
    body = await req.json();

    // Validate input (add more validation as needed)
    const updateData: { name?: string; description?: string | null; imageUrl?: string | null; isPrivate?: boolean } = {};

    if (typeof body.name === 'string' && body.name.trim()) {
      updateData.name = body.name.trim();
      // TODO: Consider updating slug if name changes, handle potential conflicts
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

    // Perform the update
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
      // Include necessary fields for the response
      include: {
        _count: { select: { members: true, boards: true } },
      }
    });

    // Add the user's role back into the response object
    const responseWithRole = {
      ...updatedOrganization,
      userRole: membershipStatus.role // Add role from membershipStatus
    };

    // TODO: Add audit log entry for organization update

    return NextResponse.json(responseWithRole, { status: 200 }); // Return updated org with role

  } catch (error: any) {
    console.error("Error updating organization:", error);
    // Handle potential errors like Prisma errors or JSON parsing errors
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }
    // Handle potential Prisma unique constraint errors if slug update is added
    // if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
    //    return NextResponse.json({ message: "Organization name (slug) is already taken." }, { status: 409 });
    // }
    return NextResponse.json({ message: "Failed to update organization." }, { status: 500 });
  }
}

// DELETE handler to delete the organization
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: organizationId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if the user is an admin of this organization
  const isAdmin = await isOrgAdmin(userId, organizationId);
  if (!isAdmin) {
    return NextResponse.json({ message: "Forbidden: Only admins can delete the organization." }, { status: 403 });
  }

  try {
    // Perform deletion using a transaction if needed (e.g., delete related data)
    await prisma.organization.delete({
      where: { id: organizationId },
    });

    // TODO: Add audit log entry for organization deletion

    return NextResponse.json({ message: "Organization deleted successfully." }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting organization:", error);
    return NextResponse.json({ message: "Failed to delete organization." }, { status: 500 });
  }
}
