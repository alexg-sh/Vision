import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteContext) {
  const resolvedParams = await params;
  const boardId = resolvedParams.id;
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { githubEnabled: true, githubToken: true }
  })
  if (!board?.githubEnabled || !board.githubToken) {
    return NextResponse.json({ message: 'GitHub not connected' }, { status: 400 })
  }

  try {
    const res = await fetch('https://api.github.com/user/repos?per_page=100&visibility=all&affiliation=owner,collaborator,organization_member', {
      headers: {
        Authorization: `Bearer ${board.githubToken}`,
        'User-Agent': 'Project Vision',
        Accept: 'application/vnd.github.v3+json'
      },
      // Avoid following HTML redirects to login page
      redirect: 'manual'
    })
    // Detect unexpected redirects (e.g. expired token leading to login page)
    if (res.status >= 300 && res.status < 400) {
      throw new Error('Invalid or expired GitHub token; please re-authorize.');
    }
    // Ensure response is JSON
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Unexpected response from GitHub API: not JSON');
    }
    if (!res.ok) throw new Error('Failed to fetch repos')
    const repos = await res.json() as Array<{ name: string; full_name: string }>
    return NextResponse.json(repos.map(r => ({ name: r.name, fullName: r.full_name })))
  } catch (err: any) {
    console.error('Error fetching GitHub repos:', err)
    return NextResponse.json({ message: err.message || 'Error fetching repos' }, { status: 500 })
  }
}