import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const organizations = await prisma.organization.findMany({
      where: {
        isPrivate: false, // Only fetch public organizations
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
            members: { where: { status: 'ACTIVE' } }, // Count only active members
            boards: { where: { isPrivate: false } }, // Count only public boards within the public org
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Show newer organizations first, or adjust as needed
      },
      // Add pagination if needed for large numbers of orgs
      // take: 20,
      // skip: 0,
    });

    return NextResponse.json(organizations, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching public organizations:", error);
    return NextResponse.json({ message: "Failed to fetch public organizations." }, { status: 500 });
  }
}
