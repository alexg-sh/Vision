"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  MessageSquare,
  Plus,
  Settings,
  ThumbsDown,
  ThumbsUp,
  Lock,
  UserPlus,
  Mail,
  MoreHorizontal,
  Trash2,
  Github,
  LinkIcon,
  BarChart3,
  Megaphone,
  PieChart,
} from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
import { PrismaClient } from '@prisma/client'; // Import PrismaClient only

// Define the Board type manually based on your Prisma schema
type Board = {
  id: string;
  name: string;
  organizationId: string;
  // Add other fields from your Prisma Board model as needed
};

// Define the Post type manually based on your Prisma schema
type Post = {
  id: string;
  title: string;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  boardId: string;
  // Add other fields from your Prisma Post model as needed
};

// Define the Organization type manually based on your Prisma schema
type Organization = {
  id: string;
  name: string;
  // Add other fields from your Prisma Organization model as needed
};

// Define the User type manually based on your Prisma schema
type User = {
  id: string;
  name: string | null;
  email: string | null;
  // Add other fields from your Prisma User model as needed
};
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BoardClient from './BoardClient'; // Import the new client component

// --- Define Types based on Schema and Includes ---

// Type for the author included in a post
type PostAuthor = User; // Use imported User type

// Type for a Post including its Author
export type PostWithAuthor = Post & { // Use imported Post type
  author: PostAuthor;
};

// Type for the full Board payload including Posts with Authors and Organization
export type BoardWithPosts = Board & { // Use imported Board type
  posts: PostWithAuthor[];
  organization: Organization; // Use imported Organization type
};

// --- Client-Specific Types ---

// Re-define PostAuthor for client-side use, potentially adding role
// Note: Using PostAuthor directly from above might be sufficient if role isn't added here
type ClientPostAuthor = User & { // Use imported User type
  role?: string; // Role might need to be added based on OrganizationMember
};

export type GitHubIssue = {
  linked: boolean;
  number: number | null;
  status: string | null;
};

export type PollOption = {
  id: number; // Assuming numeric ID for options within a poll
  text: string;
  votes: number;
};

// Extend the PostWithAuthor type with client-side state
export type PostWithClientData = PostWithAuthor & {
  userVote?: 0 | 1 | -1; // 0: no vote, 1: upvote, -1: downvote
  userPollVote?: number | null; // ID of the option voted for, or null
  pollOptions?: PollOption[];
  githubIssue?: GitHubIssue; // Assuming this structure based on usage
  author: ClientPostAuthor; // Use the client-specific author type
};


export default async function BoardPage({ params }: { params: { id: string } }) {
  // Fetch board and posts using Prisma query options
  const board = await prisma.board.findUnique({
    where: { id: params.id },
    include: {
      posts: {
        include: {
          author: true, // Include author details
        },
        orderBy: { createdAt: 'desc' },
      },
      organization: true,
    },
  });

  // Type assertion after fetching, assuming the includes guarantee the structure
  const typedBoard = board as BoardWithPosts | null;

  if (!typedBoard) {
    notFound();
  }

  // Fetch user session and role
  const session = await getServerSession(authOptions);
  let userRole = 'guest'; // Default role
  if (session?.user?.id) {
    const orgMember = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: typedBoard.organizationId,
        },
      },
      select: { role: true },
    });
    userRole = orgMember?.role?.toLowerCase() || 'guest'; // Use fetched role or guest
  }

  // Prepare initial posts with client-side data structure
  const initialPosts: PostWithClientData[] = typedBoard.posts.map((post: PostWithAuthor) => ({
    ...post,
    userVote: 0, // Initialize vote status
    userPollVote: null, // Initialize poll vote status
    // TODO: Initialize pollOptions if the post type is 'poll' from DB
    // TODO: Initialize githubIssue if linked from DB
    author: {
      ...post.author,
      role: 'member', // Placeholder: Fetch actual role for each author if needed
    }
  }));

  // Pass data to the client component
  return <BoardClient board={typedBoard} initialPosts={initialPosts} userRole={userRole} />;
}
