import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/organization/[id]/bans
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const organizationId = params.id;
  try {
    const bans = await prisma.organizationBan.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { bannedAt: 'desc' },
    });
    return NextResponse.json(bans, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: "Failed to fetch banned users." }, { status: 500 });
  }
}
