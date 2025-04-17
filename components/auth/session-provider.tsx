'use client'

import type { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"
import type React from "react"

interface AuthProviderProps {
  children: React.ReactNode
  session?: Session | null // Make session optional as it might not be available initially
}

export default function AuthProvider({ children, session }: AuthProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
