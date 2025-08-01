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
    return NextResponse.json(
      { message: "Notification ID is required" },
      { status: 400 }
    );
  }

  try {
    const updatedNotification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId,
      },
      data: {
        read: true,
      },
    });

    if (updatedNotification.count === 0) {
        return NextResponse.json({ message: "Notification not found or already marked as read" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Notification marked as read" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
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
    return NextResponse.json(
      { message: "Notification ID is required" },
      { status: 400 }
    );
  }

  try {
    const deleteResult = await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    if (deleteResult.count === 0) {
        return NextResponse.json({ message: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Notification deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
