import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/audit-log';

interface RouteContext {
  params: Promise<{ id: string }>; // Corrected: params can be a Promise
}

export async function GET(_req: Request, { params }: RouteContext) {
  const resolvedParams = await params; // Await params before accessing properties
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const board = await prisma.board.findUnique({
    where: { id: resolvedParams.id }, // Use resolvedParams.id
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
  const resolvedParams = await params; // Await params before accessing properties
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  // Fetch existing board data for audit log
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
      where: { id: resolvedParams.id }, // Use resolvedParams.id
      data: {
        name: name.trim(),
        description: description ?? null,
        image: image ?? null,
        isPrivate: Boolean(isPrivate),
      },
    });
    // Create audit log for board update
    await createAuditLog({
      orgId: before?.organizationId ?? null,
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