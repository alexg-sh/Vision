export const runtime = 'nodejs';

import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

interface ParamsContext {
  params: { id: string }
}

export async function POST(req: NextRequest, { params }: ParamsContext) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const targetId = params.id;
  if (userId === targetId) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
  }
  try {
    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: targetId } }
    });
    if (existingFollow) {
      const count = await prisma.follow.count({ where: { followingId: targetId } });
      return NextResponse.json({ followerCount: count, message: 'Already following' }, { status: 200 });
    }
    await prisma.follow.create({ data: { followerId: userId, followingId: targetId } });
    const count = await prisma.follow.count({ where: { followingId: targetId } });
    return NextResponse.json({ followerCount: count }, { status: 201 });
  } catch (error) {
    console.error('Follow API error:', error);
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: ParamsContext) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.sub as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const targetId = params.id;
  try {
    await prisma.follow.deleteMany({ where: { followerId: userId, followingId: targetId } });
    const count = await prisma.follow.count({ where: { followingId: targetId } });
    return NextResponse.json({ followerCount: count }, { status: 200 });
  } catch (error) {
    console.error('Unfollow API error:', error);
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
  }
}