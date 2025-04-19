import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: { id: string };
}

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const board = await prisma.board.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      isPrivate: true,
    },
  });
  if (!board) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(board);
}

export async function PUT(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { name, description, image, isPrivate } = await req.json();
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ message: 'Board name is required' }, { status: 400 });
  }
  try {
    const updated = await prisma.board.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        description: description ?? null,
        image: image ?? null,
        isPrivate: Boolean(isPrivate),
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: 'Update failed', error: error.message }, { status: 500 });
  }
}