import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const notifications: {
      id: string;
      type: string;
      read: boolean;
      content: string;
      createdAt: Date;
      inviter?: {
        id: string;
        name: string | null;
        image: string | null;
      } | null;
      link: string | null;
      invite?: {
        id: string;
        status: string;
      } | null;
    }[] = await prisma.notification.findMany({
      where: {
        userId: userId,
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        invite: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      read: n.read,
      content: n.content,
      timestamp: n.createdAt.toISOString(),
      user: n.inviter
        ? {
            name: n.inviter.name || "Unknown User",
            avatar: n.inviter.image,
          }
        : null,
      link: n.link,
      inviteId: n.invite?.id || null,
      inviteStatus: n.invite?.status || null,
    }));

    return NextResponse.json(formattedNotifications, { status: 200 });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ message: "Internal Server Error fetching notifications." }, { status: 500 });
  }
}
