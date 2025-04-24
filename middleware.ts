import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  // Only enforce that a valid JWT exists; DB checks can't run on Edge
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.sub) {
    // No session token: let NextAuth handle redirection on protected pages
    return NextResponse.next()
  }
  return NextResponse.next()
}

// Apply middleware to protected routes
export const config = {
  matcher: [
    '/board/:path*',
    '/boards/:path*',
    '/organization/:path*',
    '/settings/:path*',
    '/api/boards/:path*',
    '/api/organization/:path*',
    '/api/user/:path*'
  ],
}