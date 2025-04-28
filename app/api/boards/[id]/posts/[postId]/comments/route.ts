import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: { id: string; postId: string }
}

export async function GET(_req: Request, { params: paramsPromise }: { params: Promise<{ id: string; postId: string }> }) {
  const params = await paramsPromise
  const { postId } = params
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, image: true } },
      commentVotes: userId ? { where: { userId } } : false
    }
  })
  const formattedComments = comments.map(comment => ({
    id: comment.id,
    content: comment.content,
    votes: comment.votes,
    createdAt: comment.createdAt,
    author: { id: comment.author.id, name: comment.author.name, avatar: comment.author.image, role: 'member' },
    userVote: comment.commentVotes?.[0]?.voteType ?? null,
    replies: []
  }))
  return NextResponse.json(formattedComments)
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