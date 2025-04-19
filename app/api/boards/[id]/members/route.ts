import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface RouteContext { params: { id: string } }

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const members = await prisma.boardMember.findMany({
    where: { boardId: params.id },
    include: { user: { select: { id: true, name: true, email: true, image: true } } }
  });
  const result = members.map(m => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    avatar: m.user.image,
    role: m.role
  }));
  return NextResponse.json(result);
}