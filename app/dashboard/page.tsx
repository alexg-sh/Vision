import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import DashboardHeader from "@/components/dashboard-header";

// --- Update Type for BoardWithCounts ---
export type BoardWithCounts = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  isPrivate: boolean;
  organizationId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    posts: number;
  };
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch personal boards (created by user, not belonging to any organization)
  const personalBoards: BoardWithCounts[] = await prisma.board.findMany({
    where: {
      createdById: userId,
      organizationId: null,
    },
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <DashboardClient
          userId={userId}
          personalBoards={personalBoards}
        />
      </main>
    </div>
  );
}
