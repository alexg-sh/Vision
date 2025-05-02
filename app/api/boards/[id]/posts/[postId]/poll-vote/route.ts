import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string; postId: string }>;
}

export async function POST(req: Request, { params }: RouteContext) {
  const { id: boardId, postId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { optionId } = await req.json();
    if (typeof optionId !== 'number') {
      return NextResponse.json({ message: 'Option ID is required' }, { status: 400 });
    }

    // 1. Fetch current poll options
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { pollOptions: true },
    });
    if (!post?.pollOptions || !Array.isArray(post.pollOptions)) {
      return NextResponse.json({ message: 'Post not found or not a poll' }, { status: 404 });
    }
    const currentOptions = post.pollOptions as { id: number; text: string; votes: number }[];

    if (!currentOptions.some(opt => opt.id === optionId)) {
      return NextResponse.json({ message: 'Invalid poll option ID' }, { status: 404 });
    }

    // 2. Check existing vote
    const existingVote = await prisma.pollVote.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!existingVote) {
      // 3. Create vote
      await prisma.pollVote.create({ data: { userId, postId, optionId } });
    }

    // 4. Recount votes
    const voteCounts = await prisma.pollVote.groupBy({
      by: ['optionId'],
      where: { postId },
      _count: { optionId: true },
    });
    const updatedOptions = currentOptions.map(opt => {
      const vc = voteCounts.find(vc => vc.optionId === opt.id);
      return { ...opt, votes: vc?._count.optionId ?? 0 };
    });

    // 5. Persist counts
    await prisma.post.update({ where: { id: postId }, data: { pollOptions: updatedOptions as any } });

    // 6. Return updated poll
    const userVote = existingVote ? existingVote.optionId : optionId;
    return NextResponse.json({ pollOptions: updatedOptions, userPollVote: userVote });
  } catch (error: any) {
    console.error('Error recording poll vote:', error);
    return NextResponse.json({ message: 'Failed to record vote' }, { status: 500 });
  }
}
