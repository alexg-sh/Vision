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

// GET handler to fetch organization members
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: organizationId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if the user is at least a member of this organization
  const userRole = await getUserRole(userId, organizationId);
  if (!userRole) {
    // Optionally, check if the org is public and allow viewing if so
    // const organization = await prisma.organization.findUnique({ where: { id: organizationId }, select: { isPrivate: true } });
    // if (organization?.isPrivate) {
      return NextResponse.json({ message: "Forbidden: You are not a member of this organization." }, { status: 403 });
    // }
  }

  try {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: organizationId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: [
        { status: 'asc' }, // Show active members first
        { role: 'asc' }, // Then order by role (ADMIN, MEMBER)
        { user: { name: 'asc' } }, // Then by name
      ],
    });

    return NextResponse.json(members, { status: 200 });
  } catch (error: any) {
    // Log the detailed error
    console.error("Detailed error fetching organization members:", {
        organizationId: organizationId,
        errorMessage: error.message,
        errorStack: error.stack,
        errorCode: error.code, // Prisma error code if available
        errorMeta: error.meta, // Prisma error meta if available
        error: error // Log the full error object
    });
    // Return generic error to the client
    return NextResponse.json({ message: "Failed to fetch organization members." }, { status: 500 });
  }
}

// POST handler for joining a public organization
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: organizationId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized. Please log in to join." }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. Verify the organization exists and is public
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { isPrivate: true, name: true },
    });

    if (!organization) {
      return NextResponse.json({ message: "Organization not found." }, { status: 404 });
    }

    if (organization.isPrivate) {
      // Note: Joining private orgs might happen via invites, handled elsewhere.
      // This endpoint is likely for public orgs discoverable/joinable directly.
      return NextResponse.json({ message: "Cannot join a private organization directly. Look for an invite." }, { status: 403 });
    }

    // 2. Check if the user is banned in OrganizationBan table
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
      // User is banned, return detailed ban information
      return NextResponse.json({
        message: "You are banned from this organization and cannot join.",
        banDetails: {
          reason: existingBan.banReason || "No reason provided.",
          bannedAt: existingBan.bannedAt?.toISOString() || "N/A",
          appealInfo: "Please contact the organization staff to appeal this ban."
        }
      }, { status: 403 });
    }

    // 3. Check if the user is already a member OR is banned
    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: userId,
          organizationId: organizationId,
        },
      },
      select: { status: true, banReason: true, bannedAt: true } // Select necessary fields
    });

    if (existingMember) {
      if (existingMember.status === 'BANNED') {
        // User is banned, return detailed ban information
        return NextResponse.json({
          message: "You are banned from this organization and cannot rejoin.",
          banDetails: {
            reason: existingMember.banReason || "No reason provided.",
            bannedAt: existingMember.bannedAt?.toISOString() || "N/A",
            appealInfo: "Please contact the organization staff or support to appeal this ban." // Added appeal info
          }
        }, { status: 403 }); // Use 403 Forbidden status
      } else {
        // User is already an active member (or pending, etc., if other statuses exist)
        return NextResponse.json({ message: "You are already a member of this organization." }, { status: 409 }); // Use 409 Conflict
      }
    }

    // 4. Create the membership record (only if not existing and not banned)
    const newMember = await prisma.organizationMember.create({
      data: {
        userId: userId,
        organizationId: organizationId,
        role: 'MEMBER', // Default role for joining public org
        status: 'ACTIVE',
      },
      include: {
        // Include user details if needed by the frontend upon successful join
        user: { select: { id: true, name: true, email: true, image: true } }
      }
    });

    return NextResponse.json({ message: `Successfully joined ${organization.name}!`, member: newMember }, { status: 201 }); // Use 201 Created

  } catch (error: any) {
    console.error("Error joining organization:", {
      organizationId: organizationId,
      userId: userId,
      errorMessage: error.message,
      errorStack: error.stack,
      errorCode: error.code, // Log Prisma error code if available
      error: error
    });

    // Handle potential known errors like unique constraint violation more gracefully
    if (error.code === 'P2002') {
      // This case should ideally be caught by the check above, but acts as a fallback.
      // It might indicate a race condition or an unexpected state.
      // We should re-query to check if the user is banned or just already a member.
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
         // If not banned, they must already be a member
         return NextResponse.json({ message: "You are already a member of this organization." }, { status: 409 });
       }
    }

    // Generic error for other issues
    return NextResponse.json({ message: "Failed to join organization due to a server error." }, { status: 500 });
  }
}
