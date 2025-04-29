import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

interface RouteContext { params: Promise<{ id: string }> }

// PATCH: link a GitHub repository to the board
export async function PATCH(req: Request, { params }: RouteContext) {
  const { id: boardId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const { githubEnabled, githubRepo } = body
  if (!githubEnabled || !githubRepo || typeof githubRepo !== 'string') {
    return NextResponse.json({ message: 'Invalid repository data' }, { status: 400 })
  }
  try {
    const updated = await prisma.board.update({
      where: { id: boardId },
      data: { githubEnabled: true, githubRepo }
    })
    return NextResponse.json({ message: 'Repository linked', githubRepo: updated.githubRepo }, { status: 200 })
  } catch (error: any) {
    console.error('Error linking repo:', error)
    return NextResponse.json({ message: 'Failed to link repository' }, { status: 500 })
  }
}

// DELETE: disconnect GitHub integration
export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id: boardId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    await prisma.board.update({
      where: { id: boardId },
      data: { githubEnabled: false, githubRepo: null, githubToken: null }
    })
    return NextResponse.json({ message: 'GitHub disconnected' }, { status: 200 })
  } catch (error: any) {
    console.error('Error disconnecting GitHub:', error)
    return NextResponse.json({ message: 'Failed to disconnect GitHub' }, { status: 500 })
  }
}