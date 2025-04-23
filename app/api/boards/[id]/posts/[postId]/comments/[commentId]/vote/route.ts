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
    const existing = await tx.commentVote.findUnique({ where: { userId_commentId: { userId, commentId } } })
    let newType = voteType
    let delta = voteType
    if (existing) {
      if (existing.voteType === voteType) {
        // Remove vote
        await tx.commentVote.delete({ where: { userId_commentId: { userId, commentId } } })
        newType = 0
        delta = -voteType
      } else {
        // Change vote
        await tx.commentVote.update({ where: { userId_commentId: { userId, commentId } }, data: { voteType } })
        newType = voteType
        delta = voteType * 2
      }
    } else {
      // Add new vote
      await tx.commentVote.create({ data: { userId, commentId, voteType } })
    }
    const updated = await tx.comment.update({ where: { id: commentId }, data: { votes: { increment: delta } }, select: { votes: true } })
    return NextResponse.json({ votes: updated.votes, userVote: newType })
  })
}