import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, { params: paramsPromise }: { params: Promise<{ id: string; postId: string; commentId: string }> }) {
  const { commentId } = await paramsPromise
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  const { voteType } = await _req.json()
  if (![1, -1].includes(voteType)) return NextResponse.json({ message: 'Invalid voteType' }, { status: 400 })

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.commentVote.findFirst({ where: { userId, commentId } })
    let newType: number
    if (existing) {
      if (existing.voteType === voteType) {
        await tx.commentVote.deleteMany({ where: { userId, commentId } })
        newType = 0
      } else {
        await tx.commentVote.updateMany({ where: { userId, commentId }, data: { voteType } })
        newType = voteType
      }
    } else {
      await tx.commentVote.create({ data: { userId, commentId, voteType } })
      newType = voteType
    }
    const agg = await tx.commentVote.aggregate({ where: { commentId }, _sum: { voteType: true } })
    const votes = agg._sum.voteType ?? 0
    const updated = await tx.comment.update({ where: { id: commentId }, data: { votes }, select: { votes: true } })
    return NextResponse.json({ votes: updated.votes, userVote: newType })
  })
}