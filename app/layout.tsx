import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import AuthProvider from "@/components/auth/session-provider" // Import AuthProvider
import { getServerSession } from "next-auth/next" // Import getServerSession
import { authOptions } from "@/app/api/auth/[...nextauth]/route" // Import authOptions
import { Toaster } from "@/components/ui/sonner" // Import the Toaster

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Project Vision - Collect and organize feedback",
  description:
    "Project Vision helps teams collect, organize, and prioritize feedback from users, team members, and stakeholders in one place.",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Fetch session on the server
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Wrap ThemeProvider and children with AuthProvider */}
        <AuthProvider session={session}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster /> {/* Add the Toaster component here */}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}


import './globals.css'