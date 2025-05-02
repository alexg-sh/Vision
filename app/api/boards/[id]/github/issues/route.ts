import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteContext) {
  const resolvedParams = await params;
  const boardId = resolvedParams.id;
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { githubEnabled: true, githubRepo: true, githubToken: true }
  })
  if (!board || !board.githubEnabled || !board.githubRepo || !board.githubToken) {
    return NextResponse.json({ message: 'GitHub not configured' }, { status: 400 })
  }

  try {
    const issuesRes = await fetch(
      `https://api.github.com/repos/${board.githubRepo}/issues`,
      {
        headers: {
          Authorization: `Bearer ${board.githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )
    if (!issuesRes.ok) throw new Error('Failed to fetch issues')
    const issues = await issuesRes.json() as Array<{ number: number; title: string; html_url: string }>
    return NextResponse.json(
      issues.map(i => ({ number: i.number, title: i.title, url: i.html_url }))
    )
  } catch (err: any) {
    console.error('Error fetching GitHub issues:', err)
    return NextResponse.json({ message: err.message || 'Error fetching issues' }, { status: 500 })
  }
}