import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import DashboardHeader from "@/components/dashboard-header";

// --- Manual Types for Prisma v2/v3 ---
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
    members: number;
  };
};

export type OrganizationWithBoardsAndCounts = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    members: number;
  };
  boards: BoardWithCounts[];
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch personal boards (not belonging to any organization)
  const personalBoards: BoardWithCounts[] = await prisma.board.findMany({
    where: {
      createdById: userId, // Revert to using the scalar foreign key field
      // createdBy: { id: userId }, // Filter through the relation - This caused an error
      organizationId: null,
    },
    include: {
      _count: { select: { posts: true, members: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch organizations the user is a member of, including their boards
  const organizations: OrganizationWithBoardsAndCounts[] = await prisma.organization.findMany({
    where: {
      members: {
        some: { userId: userId },
      },
    },
    include: {
      boards: {
        include: {
          _count: { select: { posts: true } }, // Remove members: true
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { members: true } }, // Keep this for organization members
    },
    orderBy: { name: 'asc' },
  });

  // TODO: Fetch boards the user has joined (e.g., public boards from other orgs)
  const joinedBoards: BoardWithCounts[] = []; // Placeholder

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <DashboardClient
          userId={userId}
          personalBoards={personalBoards}
          organizations={organizations}
          joinedBoards={joinedBoards}
        />
      </main>
    </div>
  );
}
