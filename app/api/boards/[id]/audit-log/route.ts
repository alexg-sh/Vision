import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { enforceActiveBoardMembership } from '@/lib/permissions'; // Use this to ensure user is part of the board

interface RouteContext {
  params: {
    id: string; // boardId
  };
}

// GET /api/boards/[id]/audit-log
export async function GET(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  const boardId = params.id;

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const requestingUserId = session.user.id;

  // 1. Check Permissions: User must be an active member of the board to view its logs
  const permissionCheck = await enforceActiveBoardMembership(requestingUserId, boardId);
  if (permissionCheck instanceof NextResponse) {
    return permissionCheck; // User is not an active member or is banned
  }

  try {
    // 2. Fetch Audit Logs specifically for this board
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        boardId: boardId, // Filter by boardId
      },
      include: {
        user: { select: { id: true, name: true, image: true } }, // User who performed the action
        // No need to include board again as we are already filtering by it
      },
      orderBy: {
        createdAt: 'desc', // Show newest logs first
      },
      take: 100, // Limit the number of logs returned
    }) as Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string;
      details: string | null;
      createdAt: Date;
      user: { id: string; name: string | null; image: string | null };
    }>;

    // 3. Format the response
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
      // board details are implicitly known since we queried for this board
    }));

    return NextResponse.json(formattedLogs, { status: 200 });

  } catch (error: any) {
    console.error(`Error fetching audit logs for board ${boardId}:`, error);
    return NextResponse.json({ message: "Failed to fetch audit logs." }, { status: 500 });
  }
}
