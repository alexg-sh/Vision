import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Organization } from "@prisma/client"; // Import Organization type

// Define the expected shape of the membership object with organization included
interface MembershipWithOrganization {
  organization: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
  };
  // Include other fields from OrganizationMember if needed, e.g., role, status
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json([]);
  }
  const userId = session.user.id;
  try {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { organization: { select: { id: true, name: true, slug: true, imageUrl: true } } },
      orderBy: { organization: { name: 'asc' } }
    });
    const organizations = memberships.map((m: MembershipWithOrganization) => m.organization);
    return NextResponse.json(organizations);
  } catch (err) {
    console.error('Error fetching user organizations:', err);
    return NextResponse.json([]);
  }
}
