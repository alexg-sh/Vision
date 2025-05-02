"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, MessageSquare, ThumbsUp, Users, LogIn, UserPlus, LayoutDashboard } from "lucide-react"
import { useSession } from "next-auth/react"

export default function Home() {
  const { data: session, status } = useSession()

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <MessageSquare className="h-6 w-6" />
            <span>Project Vision</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/features" className="text-sm font-medium hover:underline underline-offset-4">
              Features
            </Link>
            <Link href="/support" className="text-sm font-medium hover:underline underline-offset-4">
              Support
            </Link>
          </nav>
          <div className="flex gap-4 items-center">
            {status === "loading" && (
              <div className="h-8 w-20 animate-pulse bg-muted rounded-md"></div>
            )}
            {status === "unauthenticated" && (
              <>
                <Link href="/login">
                  <Button variant="outline" className="gap-1">
                    <LogIn className="h-4 w-4" />
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="gap-1">
                    <UserPlus className="h-4 w-4" />
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
            {status === "authenticated" && (
              <Link href="/dashboard">
                <Button className="gap-1">
                  <LayoutDashboard className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Collect and organize feedback that matters
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Project Vision helps teams collect, organize, and prioritize feedback from users, team members, and
                  stakeholders in one place.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/signup">
                    <Button size="lg" className="gap-1">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/features">
                    <Button size="lg" variant="outline">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto lg:ml-auto flex justify-center lg:justify-end">
                <div className="w-full max-w-[500px] aspect-video rounded-xl bg-gray-200 dark:bg-gray-800 overflow-hidden shadow-lg">
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="font-semibold">Feature Requests</div>
                      <Button size="sm" variant="outline">
                        + New Post
                      </Button>
                    </div>
                    <div className="space-y-4 flex-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8">
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <span className="text-xs font-medium">{12 + i}</span>
                            </div>
                            <div>
                              <h3 className="font-medium">Add dark mode support</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                It would be great to have a dark mode option for the dashboard.
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything you need to collect feedback
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Project Vision provides all the tools you need to collect, organize, and act on feedback.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
              {[
                {
                  icon: <MessageSquare className="h-10 w-10" />,
                  title: "Feedback Boards",
                  description: "Create custom boards to collect feedback from users, team members, and stakeholders.",
                },
                {
                  icon: <ThumbsUp className="h-10 w-10" />,
                  title: "Voting System",
                  description: "Let users vote on feedback to help you prioritize what matters most.",
                },
                {
                  icon: <Users className="h-10 w-10" />,
                  title: "Team Collaboration",
                  description: "Work together with your team to respond to feedback and keep users updated.",
                },
              ].map((feature, i) => (
                <div key={i} className="flex flex-col items-center space-y-4 rounded-lg border p-6">
                  <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">{feature.icon}</div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-center text-gray-500 dark:text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span className="font-semibold">Project Vision</span>
          </div>
          <nav className="flex gap-4 md:gap-6">
            <Link href="/privacy" className="text-sm hover:underline underline-offset-4">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm hover:underline underline-offset-4">
              Terms
            </Link>
            <Link href="/contact" className="text-sm hover:underline underline-offset-4">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
