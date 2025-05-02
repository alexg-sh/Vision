import { NextResponse } from 'next/server'

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteContext) {
  const resolvedParams = await params;
  const boardId = resolvedParams.id;
  const clientId = process.env.GITHUB_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/github/callback`;
  const state = boardId;
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId!);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', 'repo read:org');
  return NextResponse.redirect(url.toString());
}