import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function POST(_req: Request, { params: paramsPromise }: { params: Promise<{ id: string; postId: string }> }) {
  const { id: boardId, postId } = await paramsPromise
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  const { voteType } = await _req.json()
  if (![1, -1].includes(voteType)) return NextResponse.json({ message: 'Invalid voteType' }, { status: 400 })

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.postVote.findUnique({ where: { userId_postId: { userId, postId } } })
    let newType: number;
    if (existing) {
      if (existing.voteType === voteType) {
        await tx.postVote.delete({ where: { userId_postId: { userId, postId } } })
        newType = 0
      } else {
        await tx.postVote.update({ where: { userId_postId: { userId, postId } }, data: { voteType } })
        newType = voteType
      }
    } else {
      await tx.postVote.create({ data: { userId, postId, voteType } })
      newType = voteType
    }
    const agg = await tx.postVote.aggregate({ where: { postId }, _sum: { voteType: true } })
    const votes = agg._sum.voteType ?? 0
    const updated = await tx.post.update({ where: { id: postId }, data: { votes }, select: { votes: true } })
    return NextResponse.json({ votes: updated.votes, userVote: newType })
  })
}