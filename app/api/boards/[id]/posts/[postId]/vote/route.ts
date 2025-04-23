import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, { params: paramsPromise }: { params: Promise<{ id: string; postId: string }> }) {
  const { id: boardId, postId } = await paramsPromise
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  const { voteType } = await _req.json()
  if (![1, -1].includes(voteType)) return NextResponse.json({ message: 'Invalid voteType' }, { status: 400 })

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.postVote.findUnique({ where: { userId_postId: { userId, postId } } })
    let newType = voteType
    let delta = voteType
    if (existing) {
      if (existing.voteType === voteType) {
        // Remove vote
        await tx.postVote.delete({ where: { userId_postId: { userId, postId } } })
        newType = 0
        delta = -voteType
      } else {
        // Change vote
        await tx.postVote.update({ where: { userId_postId: { userId, postId } }, data: { voteType } })
        newType = voteType
        delta = voteType * 2
      }
    } else {
      // Add new vote
      await tx.postVote.create({ data: { userId, postId, voteType } })
    }
    const updated = await tx.post.update({ where: { id: postId }, data: { votes: { increment: delta } }, select: { votes: true } })
    return NextResponse.json({ votes: updated.votes, userVote: newType })
  })
}