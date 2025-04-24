import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getMembershipStatus } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
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
    status: string;
    banReason: string | null;
    bannedAt: Date | null;
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
  const { id: orgId } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // enforce membership
  const membership = await getMembershipStatus(userId ?? '', orgId);
  if (!membership.isMember || membership.isBanned) {
    notFound();
  }
  const userRole = membership.role as 'admin' | 'member';

  // Fetch organization details including members
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      boards: {
        include: { _count: { select: { posts: true } } },
        orderBy: { createdAt: 'desc' },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: [{ status: 'asc' }, { role: 'asc' }],
      },
      auditLogs: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      _count: { select: { members: true, boards: true } },
    },
  });

  if (!organization) {
    notFound();
  }

  const finalOrganizationData = organization as OrganizationWithDetails;

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <OrganizationClient
          organization={finalOrganizationData}
          userRole={userRole}
          userId={userId || null}
        />
      </main>
    </div>
  );
}
