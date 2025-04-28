import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import type { Post as PostModel, User, PostVote } from '@prisma/client'

type PostWithIncludes = PostModel & {
  author: Pick<User, 'id' | 'name' | 'image'>;
  postVotes?: { voteType: number }[];
  tags: string[];
};

export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string; postId: string }> }) {
  const params = await paramsPromise
  const { id: boardId, postId } = params
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, name: true, image: true } },
      postVotes: userId ? { where: { userId }, select: { voteType: true } } : false
    }
  }) as PostWithIncludes | null
  if (!post) {
    return NextResponse.json({ message: 'Post not found' }, { status: 404 })
  }
  const userVote = Array.isArray(post.postVotes) && post.postVotes.length > 0 ? post.postVotes[0].voteType : null
  return NextResponse.json({
    id: post.id,
    title: post.title,
    description: post.content,
    votes: post.votes,
    status: 'planned',
    createdAt: post.createdAt.toISOString(),
    author: {
      id: post.author.id,
      name: post.author.name,
      avatar: post.author.image,
      role: 'member'
    },
    githubIssue: null,
    userVote,
    tags: post.tags
  })
}

export async function PATCH(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string; postId: string }> }) {
  const { postId } = await paramsPromise
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { tags } = await req.json()
  if (!Array.isArray(tags) || tags.some(t => typeof t !== 'string')) {
    return NextResponse.json({ message: 'Invalid tags' }, { status: 400 })
  }
  try {
    const updated = await prisma.post.update({ where: { id: postId }, data: { tags } })
    return NextResponse.json({ tags: updated.tags })
  } catch (err) {
    console.error('Error updating tags', err)
    return NextResponse.json({ message: 'Failed to update tags' }, { status: 500 })
  }
}