import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getBoardMembershipStatus } from '@/lib/permissions';
import BoardClient from './BoardClient';
import type { Board, Post, User, Organization } from '@prisma/client';


type ClientPostAuthor = {
  id: string;
  name: string | null;
  image: string | null;
  role?: string;
};

interface PostWithAuthor extends Post {
  author: User;
  votes: number;
  status?: string;
}

interface BoardWithPostsAndOrg extends Board {
  posts: PostWithAuthor[];
  organization: Organization | null;
}

export type PollOption = {
  id: number;
  text: string;
  votes: number;
};

type GithubIssue = {
  linked: boolean;
  number: number;
  url: string;
  status: string;
};

export type PostWithClientData = {
  id: string;
  title: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
  author: ClientPostAuthor;
  authorId: string;
  votes: number;
  userVote: number | null;
  pollOptions?: PollOption[];
  userPollVote?: number | null;
  githubIssue?: GithubIssue | null;
  status?: string;
  comments?: number;
  tags: string[];
};

export type ClientBoardData = {
  id: string;
  name: string;
  organizationId: string | null;
  organizationName: string | null;
  description?: string | null;
  imageUrl?: string | null;
};


type BoardUserRole = 'guest' | 'member' | 'moderator' | 'admin' | 'creator';


export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      posts: {
        include: {
          author: true,
          postVotes: userId ? { where: { userId } } : false,
        },
        orderBy: { createdAt: 'desc' }
      },
      organization: true,
    },
  }) as (BoardWithPostsAndOrg & { createdById: string }) | null;
  if (!board) {
    notFound();
  }

  let userRole: BoardUserRole;
  if (!board.isPrivate) {
    userRole = board.createdById === userId ? 'creator' : 'guest';
  } else if (board.createdById === userId) {
    userRole = 'creator';
  } else {
    const membership = await getBoardMembershipStatus(userId ?? '', boardId);
    if (!membership.isMember || membership.isBanned) {
      notFound();
    }
    userRole = membership.role as unknown as 'admin' | 'moderator' | 'member';
  }

  console.log(`[BoardPage] Determined userRole for board ${boardId}: ${userRole} (User ID: ${userId}, Creator ID: ${board.createdById})`);

  try {
    const initialPosts: PostWithClientData[] = board.posts.map((post: any): PostWithClientData => {
      const userVote = post.postVotes && post.postVotes.length > 0 ? post.postVotes[0].voteType : null;
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.authorId,
        votes: post.votes,
        status: post.status,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        userVote,
        userPollVote: null,
        pollOptions: undefined,
        githubIssue: undefined,
        comments: 0,
        tags: post.tags ?? [],
        author: {
          id: post.author.id,
          name: post.author.name,
          image: post.author.image,
          role: 'member',
        }
      };
    });

    const clientBoardData: ClientBoardData = {
      id: board.id,
      name: board.name,
      organizationId: board.organizationId,
      organizationName: board.organization?.name ?? null,
      description: board.description,
      imageUrl: null,
    };

    return <BoardClient board={clientBoardData} initialPosts={initialPosts} userRole={userRole} />;

  } catch (error) {
    console.error("Error fetching board page data:", error);
    notFound();
  }
}
