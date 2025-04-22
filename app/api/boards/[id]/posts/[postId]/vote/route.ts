import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string; postId: string }>
}

export async function POST(_req: Request, { params: paramsPromise }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const { id: boardId, postId } = await paramsPromise
  const { voteType } = await _req.json() as { voteType: 1 | -1 }
  const userId = session.user.id

  // Find existing vote
  const existing = await prisma.postVote.findUnique({
    where: { postId_userId: { postId, userId } }
  })

  let newUserVote = voteType
  if (existing) {
    if (existing.voteType === voteType) {
      // remove vote
      await prisma.postVote.delete({ where: { postId_userId: { postId, userId } } })
      newUserVote = 0
    } else {
      // update vote
      await prisma.postVote.update({
        where: { postId_userId: { postId, userId } },
        data: { voteType }
      })
    }
  } else {
    // create vote
    await prisma.postVote.create({
      data: { postId, userId, voteType }
    })
  }

  // Recalculate aggregate
  const agg = await prisma.postVote.aggregate({
    where: { postId },
    _sum: { voteType: true }
  })
  const total = agg._sum.voteType ?? 0

  return NextResponse.json({ votes: total, userVote: newUserVote })
}