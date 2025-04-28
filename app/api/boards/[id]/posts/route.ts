import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { Post, User, PostVote } from '@prisma/client'

type PostWithDetails = Post & {
  author: Pick<User, 'id' | 'name' | 'image'>;
  _count: {
    postVotes: number;
    comments: number;
  };
  postVotes?: PostVote[];
};

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params: paramsPromise }: RouteContext) {
  const params = await paramsPromise
  const boardId = params.id
  const { searchParams } = new URL(req.url);
  const sortBy = searchParams.get('sortBy');
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id

  let orderBy: any;

  if (sortBy === 'popular') {
    orderBy = { votes: 'desc' };
  } else {
    orderBy = { createdAt: 'desc' };
  }

  try {
    const posts = await prisma.post.findMany({
      where: { boardId },
      orderBy: orderBy,
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: {
          select: {
            postVotes: true,
            comments: true,
          }
        },
        postVotes: userId ? {
          where: { userId: userId }
        } : false,
      }
    });

    const formattedPosts = posts.map((post: PostWithDetails) => {
      const userVoteRecord = post.postVotes;
      const userVote = userVoteRecord && userVoteRecord.length > 0 ? userVoteRecord[0].voteType : null;

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        tags: post.tags,
        createdAt: post.createdAt,
        authorId: post.authorId,
        author: post.author,
        votes: post.votes,
        commentCount: post._count.comments,
        voteCount: post._count.postVotes,
        userVote: userVote,
      };
    });

    return NextResponse.json(formattedPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ message: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: Request, { params: paramsPromise }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  const params = await paramsPromise
  const boardId = params.id
  try {
    const { title, content, tags } = await req.json()
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 })
    }
    const newPost = await prisma.post.create({
      data: { title: title.trim(), content: content || null, boardId, authorId: userId, tags: tags ?? [] }
    })

    const postWithDetails = await prisma.post.findUnique({
      where: { id: newPost.id },
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { postVotes: true, comments: true } }
      }
    })

    const formattedNewPost = {
      ...postWithDetails,
      votes: postWithDetails?._count.postVotes ?? 0,
      comments: postWithDetails?._count.comments ?? 0,
      userVote: null,
      tags: postWithDetails?.tags ?? []
    };

    return NextResponse.json(formattedNewPost, { status: 201 })
  } catch (error: any) {
    console.error('Error creating post:', error)
    return NextResponse.json({ message: 'Failed to create post' }, { status: 500 })
  }
}