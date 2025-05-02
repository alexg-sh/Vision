import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { enforceActiveBoardMembership } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const requestingUserId = session.user.id;
  const boardId = resolvedParams.id;

  const boardRecord = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      createdById: true,
      createdBy: { select: { id: true, name: true, email: true, image: true } }
    }
  });
  if (boardRecord?.createdById !== requestingUserId) {
    const permissionCheck = await enforceActiveBoardMembership(requestingUserId, boardId);
    if (permissionCheck instanceof NextResponse) {
      return permissionCheck;
    }
  }

  try {
    const membersData = await prisma.boardMember.findMany({
      where: { boardId: boardId },
      select: {
        role: true,
        status: true,
        user: { select: { id: true, name: true, email: true, image: true } }
      }
    });

    type MemberData = {
      role: string;
      status: string;
      user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
      };
    };

    interface Member {
      id: string;
      name: string | null;
      email: string | null;
      avatar: string | null;
      role: string;
      status: string;
    }

    const result: Member[] = membersData.map((m: MemberData) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.image,
      role: m.role,
      status: m.status
    }));

    const creator = boardRecord?.createdBy;
    if (creator && !result.find((m) => m.id === creator.id)) {
      result.unshift({
        id: creator.id,
        name: creator.name,
        email: creator.email,
        avatar: creator.image,
        role: 'CREATOR',
        status: 'ACTIVE'
      });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error(`Error fetching members for board ${resolvedParams.id}:`, {
        message: error.message,
        stack: error.stack,
        code: error.code,
        meta: error.meta,
    });
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to fetch board members: ${error.message}`
      : 'Failed to fetch board members';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}