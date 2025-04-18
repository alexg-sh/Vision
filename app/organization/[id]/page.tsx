import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import OrganizationClient from './OrganizationClient';
import DashboardHeader from '@/components/dashboard-header';

// --- Manual type for OrganizationWithDetails ---
export type OrganizationWithDetails = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  boards: Array<{
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
  }>;
  members: Array<{
    id: string;
    userId: string;
    organizationId: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    userId: string;
    boardId: string | null;
    createdAt: Date;
    details: string | null;
    user: {
      id: string;
      name: string | null;
    };
  }>;
  _count: {
    members: number;
    boards: number;
  };
};

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const resolvedParams = await params;

  // Fetch organization details using the defined query
  let organization = await prisma.organization.findUnique({
    where: { id: resolvedParams.id },
    include: {
      boards: {
        where: { isPrivate: false },
        include: {
          _count: { select: { posts: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { role: 'asc' },
      },
      auditLogs: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        // Removed `user` relation as it does not exist in the schema
      },
      _count: { select: { members: true, boards: true } },
    },
  });

  if (!organization) {
    notFound();
  }

  let userRole: "admin" | "moderator" | "member" | "guest" = 'guest';
  if (userId) {
    const orgMember = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: userId,
          organizationId: organization.id,
        },
      },
      select: { role: true },
    });
    userRole = (orgMember?.role?.toLowerCase() as typeof userRole) || 'guest';

    if (organization.isPrivate && userRole === 'guest') {
      notFound();
    }

    if (userRole !== 'guest') {
      // Fetch all boards for members/admins, including private ones
      const allBoards = await prisma.board.findMany({
        where: { organizationId: organization.id },
        include: {
          _count: { select: { posts: true } }, // Removed `members`
        },
        orderBy: { createdAt: 'desc' },
      });
      // Overwrite boards and update count
      organization = {
        ...organization,
        boards: allBoards,
        _count: {
          ...organization._count,
          boards: allBoards.length,
        },
      };
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <OrganizationClient
          organization={organization}
          userRole={userRole}
          userId={userId || null}
        />
      </main>
    </div>
  );
}
