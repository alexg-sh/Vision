import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Find all active memberships for the user and include the organization details
    const memberships = await prisma.organizationMember.findMany({
      where: {
        userId: userId,
        status: 'ACTIVE', // Ensure the user is an active member
      },
      include: {
        organization: { // Include the full organization object
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            // Add any other organization fields needed by the header dropdown
          }
        },
      },
      orderBy: {
        organization: {
          name: 'asc', // Order organizations alphabetically by name
        },
      },
    }) as Array<{
      organization: {
        id: string;
        name: string;
        slug: string;
        imageUrl: string | null;
      };
    }>;

    // Extract just the organization data from the memberships
    const organizations = memberships.map(membership => membership.organization);

    return NextResponse.json(organizations, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching user organizations:", error);
    return NextResponse.json({ message: "Failed to fetch organizations." }, { status: 500 });
  }
}
