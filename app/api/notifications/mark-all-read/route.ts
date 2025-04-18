import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    await prisma.notification.updateMany({
      where: {
        userId: userId,
        read: false, // Only update unread notifications
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ message: "All notifications marked as read" }, { status: 200 });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Update all unread notifications for the user to read
    const updateResult = await prisma.notification.updateMany({
      where: {
        userId: userId,
        read: false, // Only target unread notifications
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json(
      { message: `Marked ${updateResult.count} notifications as read` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
