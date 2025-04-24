import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getBoardMembershipStatus } from '@/lib/permissions';
import BoardClient from './BoardClient'; // Import the client component
// Import the generated types directly if they exist
import type { Board, Post, User, Organization } from '@prisma/client';

// --- Define Types based on Query Structure ---

// Define the author structure expected within a post
type ClientPostAuthor = {
  id: string;
  name: string | null;
  image: string | null;
  role?: string; // Role is added later in the mapping
};

// Define the structure of a post fetched from the DB including the author
// Manually define based on the 'include: { author: true }'
interface PostWithAuthor extends Post { // Extend the base Post type
  author: User;
  votes: number; // Add the votes property
  status?: string; // Add the status property
}

// Define the structure of the board fetched from the DB including posts and organization
// Manually define based on the 'include: { posts: { include: { author: true } }, organization: true }'
interface BoardWithPostsAndOrg extends Board { // Extend the base Board type
  posts: PostWithAuthor[];
  organization: Organization | null;
}

// Define the structure for Poll Options (if used)
export type PollOption = {
  id: number; // Or string, depending on your implementation
  text: string;
  votes: number;
};

// Define the structure for GitHub Issue link (if used)
type GithubIssue = {
  linked: boolean;
  number: number;
  url: string;
  status: string; // e.g., 'open', 'closed'
};

// Define the data structure passed to the Client Component for a Post
export type PostWithClientData = {
  id: string;
  title: string;
  content: string | null;
  createdAt: string; // Serialized Date
  updatedAt: string; // Serialized Date
  author: ClientPostAuthor;
  authorId: string;
  votes: number;
  userVote: number | null; // Or 0 | 1 | -1
  pollOptions?: PollOption[];
  userPollVote?: number | null; // ID of the voted option
  githubIssue?: GithubIssue | null;
  status?: string; // Example if status is needed
  comments?: number; // Example
};

// Define the simplified, serializable board data for the client
export type ClientBoardData = {
  id: string;
  name: string;
  organizationId: string | null;
  organizationName: string | null;
  description?: string | null;
  imageUrl?: string | null;
};


// Define possible user roles on a board
type BoardUserRole = 'guest' | 'member' | 'moderator' | 'admin' | 'creator';


export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Enforce active membership
  const membership = await getBoardMembershipStatus(userId ?? '', boardId);
  if (!membership.isMember || membership.isBanned) {
    notFound();
  }
  const userRole = membership.role as 'admin' | 'moderator' | 'member';

  let board: BoardWithPostsAndOrg | null = null;

  try {
    // Fetch board and its relations
    // Type the result explicitly for clarity
    board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        posts: {
          include: { author: true }, // Include author details for each post
          orderBy: { createdAt: 'desc' },
        },
        organization: true, // Include organization details
      },
    }) as BoardWithPostsAndOrg | null; // Explicit cast

    if (!board) {
      notFound();
    }

    // Prepare initial posts with client-side data structure
    // Explicitly type the 'post' parameter with the manually defined interface
    const initialPosts: PostWithClientData[] = board.posts.map((post: PostWithAuthor): PostWithClientData => ({
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      votes: post.votes,
      status: post.status,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      userVote: 0,
      userPollVote: null,
      pollOptions: undefined,
      githubIssue: undefined,
      comments: 0,
      author: {
        id: post.author.id,
        name: post.author.name,
        image: post.author.image,
        role: 'member',
      }
    }));

    // Create a simplified, serializable board object for the client
    const clientBoardData: ClientBoardData = {
      id: board.id,
      name: board.name,
      organizationId: board.organizationId,
      organizationName: board.organization?.name ?? null,
      description: board.description,
      imageUrl: null, // Replace with a default value or remove if not needed
    };

    // Pass serializable data to the client component
    return <BoardClient board={clientBoardData} initialPosts={initialPosts} userRole={userRole} />;

  } catch (error) {
    console.error("Error fetching board page data:", error);
    notFound();
  }
}
