import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string; postId: string; commentId: string }>
}

export async function POST(_req: Request, { params: paramsPromise }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { commentId } = await paramsPromise
  const { voteType } = await _req.json() as { voteType: 1 | -1 }
  const userId = session.user.id

  // Find existing vote
  const existing = await prisma.commentVote.findUnique({
    where: { commentId_userId: { commentId, userId } }
  })

  let newUserVote = voteType
  if (existing) {
    if (existing.voteType === voteType) {
      await prisma.commentVote.delete({ where: { commentId_userId: { commentId, userId } } })
      newUserVote = 0
    } else {
      await prisma.commentVote.update({ where: { commentId_userId: { commentId, userId } }, data: { voteType } })
    }
  } else {
    await prisma.commentVote.create({ data: { commentId, userId, voteType } })
  }

  // Recalculate aggregate
  const agg = await prisma.commentVote.aggregate({ where: { commentId }, _sum: { voteType: true } })
  const total = agg._sum.voteType ?? 0

  return NextResponse.json({ votes: total, userVote: newUserVote })
}