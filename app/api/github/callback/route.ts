import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const boardId = state

  if (!code) {
    console.error('GitHub Callback Error: Code not provided')
    return NextResponse.redirect(new URL(`/error?message=GitHub+authorization+failed`, process.env.NEXTAUTH_URL).toString())
  }
  if (!boardId) {
    console.error('GitHub Callback Error: State (boardId) not provided')
    return NextResponse.redirect(new URL(`/error?message=GitHub+authorization+state+missing`, process.env.NEXTAUTH_URL).toString())
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/github/callback`;

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_ID,
        client_secret: process.env.GITHUB_SECRET,
        code,
        redirect_uri: redirectUri,
        state: boardId,
      }),
    })

    if (!tokenRes.ok) {
      const errorData = await tokenRes.json().catch(() => ({ error_description: 'Unknown error during token exchange' }));
      console.error("GitHub token exchange failed:", tokenRes.status, errorData);
      const errorUrl = new URL(`/board/${boardId}/settings?tab=github&error=token_exchange_failed`, process.env.NEXTAUTH_URL);
      errorUrl.searchParams.set('error_details', errorData.error_description || tokenRes.statusText);
      return NextResponse.redirect(errorUrl.toString());
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token as string

    if (!accessToken) {
      console.error("GitHub token data missing access_token:", tokenData);
      const errorUrl = new URL(`/board/${boardId}/settings?tab=github&error=token_missing`, process.env.NEXTAUTH_URL);
      return NextResponse.redirect(errorUrl.toString());
    }

    await prisma.board.update({
      where: { id: boardId },
      data: { githubEnabled: true, githubToken: accessToken }
    })

    return NextResponse.redirect(new URL(`/board/${boardId}/settings?tab=github&connected=true`, process.env.NEXTAUTH_URL).toString())

  } catch (error: any) {
      console.error("Error in GitHub callback handler:", error);
      const errorUrl = new URL(`/board/${boardId}/settings?tab=github&error=callback_handler_failed`, process.env.NEXTAUTH_URL);
      errorUrl.searchParams.set('error_message', error.message || 'An unexpected error occurred');
      return NextResponse.redirect(errorUrl.toString());
  }
}