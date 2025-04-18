import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import OrganizationClient from './OrganizationClient';
import DashboardHeader from '@/components/dashboard-header';
import { OrganizationMember } from '@prisma/client'; // Import OrganizationMember type

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
    status: string; // Add status field
    banReason: string | null; // Add banReason field
    bannedAt: Date | null; // Add bannedAt field
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

  // Fetch organization details including members
  let organization = await prisma.organization.findUnique({
    where: { id: resolvedParams.id },
    include: {
      boards: { // Initially fetch only public boards for guests
        where: { isPrivate: false },
        include: { _count: { select: { posts: true } } }, // Removed members count here
        orderBy: { createdAt: 'desc' },
      },
      members: { // Fetch all members to determine role and display
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: [{ status: 'asc' }, { role: 'asc' }],
      },
      auditLogs: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { // Include user details for audit logs
           user: { select: { id: true, name: true } }
        }
      },
      _count: { select: { members: true, boards: true } }, // Count all boards initially
    },
  });

  if (!organization) {
    notFound();
  }

  let userRole: "admin" | "moderator" | "member" | "guest" = 'guest';
  let currentUserMemberInfo: OrganizationMember | undefined;

  if (userId) {
    // Find the current user within the fetched members list
    // Explicitly type 'member' to resolve the implicit 'any' error
    currentUserMemberInfo = organization.members.find((member: OrganizationMember) => member.userId === userId);

    // Determine role based on found member info and status
    if (currentUserMemberInfo && currentUserMemberInfo.status === 'ACTIVE') { // Check status is ACTIVE
        userRole = (currentUserMemberInfo.role?.toLowerCase() as typeof userRole) || 'guest';
    }
    // If member exists but status is not ACTIVE (e.g., BANNED), they are treated as 'guest'

    // Check access for private organizations
    if (organization.isPrivate && userRole === 'guest') {
        notFound(); // Guests (including banned/inactive) cannot view private orgs
    }

    // If the user is an active member (not guest), fetch ALL boards including private ones
    if (userRole !== 'guest') {
      const allBoards = await prisma.board.findMany({
        where: { organizationId: organization.id },
        include: {
          _count: { select: { posts: true } }, // Count posts per board
        },
        orderBy: { createdAt: 'desc' },
      });
      // Overwrite boards and update count
      organization = {
        ...organization,
        boards: allBoards,
        _count: {
          ...organization._count,
          boards: allBoards.length, // Update board count based on all boards
        },
      };
    }
  }
  // If not logged in (no userId), userRole remains 'guest'.
  // If org is private and user is 'guest', they should be redirected or shown notFound.
  else if (organization.isPrivate) {
      notFound(); // Guests cannot view private orgs
  }

  // Cast the potentially modified organization object to the required type for the client
  // Ensure the structure matches OrganizationWithDetails after modifications
  const finalOrganizationData = organization as OrganizationWithDetails;

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <OrganizationClient
          organization={finalOrganizationData} // Pass the potentially updated org data
          userRole={userRole}
          userId={userId || null}
        />
      </main>
    </div>
  );
}
