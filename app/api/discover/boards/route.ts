import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const boards = await prisma.board.findMany({
      where: {
        isPrivate: false,
        OR: [
          { organization: { isPrivate: false } },
          { organizationId: null }
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(boards, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching public boards:", error);
    return NextResponse.json({ message: "Failed to fetch public boards." }, { status: 500 });
  }
}
