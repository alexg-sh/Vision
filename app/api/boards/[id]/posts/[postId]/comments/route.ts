import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: { id: string; postId: string }
}

export async function GET(_req: Request, { params: paramsPromise }: { params: Promise<{ id: string; postId: string }> }) {
  const params = await paramsPromise // Await params
  const { postId } = params
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, image: true } }
    }
  })
  return NextResponse.json(comments)
}

export async function POST(req: Request, { params: paramsPromise }: { params: Promise<{ id: string; postId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const params = await paramsPromise // Await the params Promise
  const { postId } = params
  const { content } = await req.json()
  if (!content || typeof content !== 'string') {
    return NextResponse.json({ message: 'Content is required' }, { status: 400 })
  }
  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId: session.user.id,
      content: content.trim()
    },
    include: {
      author: { select: { id: true, name: true, image: true } }
    }
  })
  return NextResponse.json(comment, { status: 201 })
}