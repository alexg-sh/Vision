import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

interface RouteContext { params: { id: string } }

// GET /api/boards/[id]/github/callback?code=...&state=boardId
export async function GET(req: Request, { params }: RouteContext) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const boardId = state || params.id

  if (!code) {
    return NextResponse.json({ message: 'Code not provided' }, { status: 400 })
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_ID,
      client_secret: process.env.GITHUB_SECRET,
      code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/boards/${boardId}/github/callback`,
      state: boardId,
    }),
  })
  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token as string
  if (!accessToken) {
    return NextResponse.json({ message: 'Failed to get access token' }, { status: 400 })
  }

  // Store token and mark enabled
  await prisma.board.update({
    where: { id: boardId },
    data: { githubEnabled: true, githubToken: accessToken }
  })

  // Redirect back to settings page
  return NextResponse.redirect(new URL(`/board/${boardId}/settings?tab=github&connected=true`, process.env.NEXTAUTH_URL).toString())
}