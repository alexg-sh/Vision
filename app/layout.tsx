import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import AuthProvider from "@/components/auth/session-provider"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { Toaster } from "@/components/ui/sonner"
import { NotificationProvider } from "@/context/notification-context";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Project Vision - Collect and organize feedback",
  description:
    "Project Vision helps teams collect, organize, and prioritize feedback from users, team members, and stakeholders in one place.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Wrap ThemeProvider and children with AuthProvider */}
        <AuthProvider session={session}>
          <NotificationProvider> {/* Add NotificationProvider */}
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {/* Global providers; header included in nested layouts */}
              {/* Add container div for consistent margins */}
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
              <Toaster /> {/* Add the Toaster component here */}
            </ThemeProvider>
          </NotificationProvider> {/* Close NotificationProvider */}
        </AuthProvider>
      </body>
    </html>
  )
}


import './globals.css'