import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

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

  // 1. Owned personal boards
  const personalBoards: BoardWithCounts[] = await prisma.board.findMany({
    where: { createdById: userId, organizationId: null },
    include: { _count: { select: { posts: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Boards where user is member (excluding owned to avoid duplicates)
  const memberBoards: BoardWithCounts[] = await prisma.board.findMany({
    where: { 
      members: { some: { userId } },
      createdById: { not: userId }
    },
    include: { _count: { select: { posts: true } } },
    orderBy: { createdAt: 'desc' },
  });

  // 3. Organizations where user is a member
  const myOrgs = await prisma.organization.findMany({
    where: { members: { some: { userId } } },
    select: { id: true, name: true, slug: true, imageUrl: true }
  });

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container py-6 space-y-10">
        <DashboardClient
          userId={userId}
          personalBoards={personalBoards}
          memberBoards={memberBoards}
          organizations={myOrgs}
        />
      </main>
    </div>
  );
}
