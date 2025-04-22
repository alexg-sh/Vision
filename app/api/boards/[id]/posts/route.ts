import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// Define RouteContext for clarity, assuming params might be a Promise
interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise // Await the params Promise
  const boardId = params.id
  const posts = await prisma.post.findMany({
    where: { boardId },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, name: true, image: true } } }
  })
  return NextResponse.json(posts)
}

export async function POST(req: Request, { params: paramsPromise }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  const params = await paramsPromise // Await the params Promise
  const boardId = params.id
  try {
    const { title, content } = await req.json()
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 })
    }
    const newPost = await prisma.post.create({
      data: { title: title.trim(), content: content || null, boardId, authorId: userId }
    })
    const postWithAuthor = await prisma.post.findUnique({
      where: { id: newPost.id },
      include: { author: { select: { id: true, name: true, image: true } } }
    })
    return NextResponse.json(postWithAuthor, { status: 201 })
  } catch (error: any) {
    console.error('Error creating post:', error)
    return NextResponse.json({ message: 'Failed to create post' }, { status: 500 })
  }
}