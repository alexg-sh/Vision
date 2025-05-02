import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  let membershipOrgIds: string[] = [];
  if (userId) {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: userId, status: 'ACTIVE' },
      select: { organizationId: true }
    });
    membershipOrgIds = memberships.map(m => m.organizationId);
  }

  try {
    const organizations = await prisma.organization.findMany({
      where: {
        OR: [
          { isPrivate: false },
          { id: { in: membershipOrgIds } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        createdAt: true,
        _count: {
          select: {
            members: { where: { status: 'ACTIVE' } },
            boards: { where: { isPrivate: false } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(organizations, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching public organizations:", error);
    return NextResponse.json({ message: "Failed to fetch public organizations." }, { status: 500 });
  }
}
