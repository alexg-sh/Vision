import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { enforceActiveMembership } from '@/lib/permissions';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  const organizationId = params.id;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const requestingUserId = session.user.id;

  const permissionCheck = await enforceActiveMembership(requestingUserId, organizationId);
  if (permissionCheck instanceof NextResponse) {
    return permissionCheck;
  }

  try {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        organizationId: organizationId,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        board: { select: { id: true, name: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    }) as Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string | null;
      details: string | null;
      createdAt: Date;
      user: { id: string; name: string | null; image: string | null };
      board: { id: string; name: string } | null;
    }>;

    const formattedLogs = auditLogs.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details ? JSON.parse(log.details) : null,
      timestamp: log.createdAt,
      user: {
        id: log.user.id,
        name: log.user.name || 'Unknown User',
        image: log.user.image,
      },
      board: log.board ? {
        id: log.board.id,
        name: log.board.name,
      } : null,
    }));

    return NextResponse.json(formattedLogs, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching organization audit logs:", error);
    return NextResponse.json({ message: "Failed to fetch audit logs." }, { status: 500 });
  }
}
