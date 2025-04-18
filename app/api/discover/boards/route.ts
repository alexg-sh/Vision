import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const boards = await prisma.board.findMany({
      where: {
        isPrivate: false, // Only fetch public boards
        organization: {
          isPrivate: false, // Ensure the parent organization is also public
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        organization: { // Include basic organization info
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
          }
        },
        // Add counts if needed, e.g., post count
        // _count: {
        //   select: { posts: true }
        // }
      },
      orderBy: {
        createdAt: 'desc', // Show newer boards first, or adjust as needed
      },
      // Add pagination if needed
      // take: 20,
      // skip: 0,
    });

    return NextResponse.json(boards, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching public boards:", error);
    return NextResponse.json({ message: "Failed to fetch public boards." }, { status: 500 });
  }
}
