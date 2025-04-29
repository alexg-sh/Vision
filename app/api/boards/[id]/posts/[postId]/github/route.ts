import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

interface RouteContext { params: Promise<{ id: string; postId: string }> }

// PATCH /api/boards/[id]/posts/[postId]/github
export async function PATCH(req: Request, { params }: RouteContext) {
  const { id: boardId, postId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const { issueNumber, issueUrl, issueStatus } = await req.json()
  if (typeof issueNumber !== 'number' || typeof issueUrl !== 'string' || typeof issueStatus !== 'string') {
    return NextResponse.json({ message: 'Invalid issue data' }, { status: 400 })
  }
  try {
    await prisma.post.update({
      where: { id: postId },
      data: {
        githubIssueNumber: issueNumber,
        githubIssueUrl: issueUrl,
        githubIssueStatus: issueStatus
      }
    })
    return NextResponse.json({ message: 'Issue linked', githubIssue: {
      number: issueNumber,
      url: issueUrl,
      status: issueStatus
    }})
  } catch (err: any) {
    console.error('Error linking issue:', err)
    return NextResponse.json({ message: 'Failed to link issue' }, { status: 500 })
  }
}

// DELETE /api/boards/[id]/posts/[postId]/github
export async function DELETE(_req: Request, { params }: RouteContext) {
  const { postId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    await prisma.post.update({
      where: { id: postId },
      data: { githubIssueNumber: null, githubIssueUrl: null, githubIssueStatus: null }
    })
    return NextResponse.json({ message: 'Issue unlinked' })
  } catch (err: any) {
    console.error('Error unlinking issue:', err)
    return NextResponse.json({ message: 'Failed to unlink issue' }, { status: 500 })
  }
}