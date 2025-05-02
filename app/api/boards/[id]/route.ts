import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit-log';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const board = await prisma.board.findUnique({
    where: { id: resolvedParams.id },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      isPrivate: true,
      githubEnabled: true,
      githubRepo: true,
      createdById: true
    },
  });
  if (!board) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(board);
}

export async function PUT(req: Request, { params }: RouteContext) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const before = await prisma.board.findUnique({
    where: { id: resolvedParams.id },
    select: { name: true, description: true, organizationId: true }
  });
  const { name, description, image, isPrivate } = await req.json();
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ message: 'Board name is required' }, { status: 400 });
  }
  try {
    const updated = await prisma.board.update({
      where: { id: resolvedParams.id },
      data: {
        name: name.trim(),
        description: description ?? null,
        image: image ?? null,
        isPrivate: Boolean(isPrivate),
      },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        isPrivate: true,
        organizationId: true,
        createdById: true,
        githubEnabled: true,
        githubRepo: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    await createAuditLog({
      orgId: before?.organizationId ?? undefined,
      boardId: resolvedParams.id,
      action: 'UPDATE_BOARD',
      entityType: 'BOARD',
      entityId: updated.id,
      entityName: updated.name,
      details: {
        oldName: before?.name,
        newName: updated.name,
        oldDescription: before?.description,
        newDescription: updated.description,
      }
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: 'Update failed', error: error.message }, { status: 500 });
  }
}