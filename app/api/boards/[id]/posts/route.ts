import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
// Import specific types from Prisma Client
import { Post, User, PostVote } from '@prisma/client'

// Define the structure of the post object returned by the query
// Use imported model types directly
type PostWithDetails = Post & {
  author: Pick<User, 'id' | 'name' | 'image'>;
  _count: {
    postVotes: number;
    comments: number;
  };
  postVotes?: PostVote[]; // This is conditional based on userId
};

// Define RouteContext for clarity
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

  // Determine sorting order based on sortBy query parameter
  if (sortBy === 'popular') {
    // Order by the votes field which contains the actual vote balance
    orderBy = { votes: 'desc' };
  } else {
    // Default: order by newest
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
            postVotes: true, // Total count of votes (regardless of value)
            comments: true,  // Count comments
          }
        },
        // Include the specific vote of the current user if logged in
        postVotes: userId ? {
          where: { userId: userId }
        } : false,
      }
    });

    // Map posts to include votes count and userVote status
    const formattedPosts = posts.map((post: PostWithDetails) => {
      // Access postVotes safely, knowing it might be undefined if user is not logged in
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
        votes: post.votes, // Use the actual vote balance from the Post model
        commentCount: post._count.comments,
        voteCount: post._count.postVotes, // Total number of votes cast (for analytics/display)
        userVote: userVote, // Include the user's vote status (1, -1, or null)
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
  const params = await paramsPromise // Await the params Promise
  const boardId = params.id
  try {
    const { title, content, tags } = await req.json()
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 })
    }
    const newPost = await prisma.post.create({
      data: { title: title.trim(), content: content || null, boardId, authorId: userId, tags: tags ?? [] }
    })
    // Fetch the newly created post with necessary includes for immediate display
    const postWithDetails = await prisma.post.findUnique({
      where: { id: newPost.id },
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { postVotes: true, comments: true } }
      }
    })

    // Format the new post similar to the GET response
    const formattedNewPost = {
      ...postWithDetails,
      votes: postWithDetails?._count.postVotes ?? 0,
      comments: postWithDetails?._count.comments ?? 0,
      userVote: null, // New post, user hasn't voted yet
      tags: postWithDetails?.tags ?? []
    };

    return NextResponse.json(formattedNewPost, { status: 201 })
  } catch (error: any) {
    console.error('Error creating post:', error)
    return NextResponse.json({ message: 'Failed to create post' }, { status: 500 })
  }
}