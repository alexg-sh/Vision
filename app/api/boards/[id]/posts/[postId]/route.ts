import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string; postId: string } }) {
  const { id: boardId, postId } = params
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, name: true, image: true } }
    }
  })
  if (!post) {
    return NextResponse.json({ message: 'Post not found' }, { status: 404 })
  }
  return NextResponse.json({
    id: post.id,
    title: post.title,
    description: post.content,
    votes: 0, // implement vote counting separately
    status: 'planned', // default or derive from field
    createdAt: post.createdAt.toISOString(),
    author: {
      id: post.author.id,
      name: post.author.name,
      avatar: post.author.image,
      role: 'member'
    },
    githubIssue: null,
    userVote: 0
  })
}