import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const notificationId = params.id;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  if (!notificationId) {
    return NextResponse.json({ message: "Notification ID is required" }, { status: 400 });
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    // Ensure the notification belongs to the current user
    if (!notification || notification.userId !== userId) {
      return NextResponse.json({ message: "Notification not found or access denied" }, { status: 404 });
    }

    // Only update if it's not already read
    if (!notification.read) {
        await prisma.notification.update({
          where: {
            id: notificationId,
          },
          data: {
            read: true,
          },
        });
    }

    return NextResponse.json({ message: "Notification marked as read" }, { status: 200 });
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
