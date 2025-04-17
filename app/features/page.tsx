import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, ThumbsUp, Users, Github, BarChart3, Megaphone } from "lucide-react"

export default function FeaturesPage() {
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
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Powerful Features for Effective Feedback
                </h1>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Project Vision provides all the tools you need to collect, organize, and act on feedback.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
              <Card>
                <CardHeader>
                  <div className="rounded-full bg-primary/10 p-3 w-fit mb-3">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Feedback Boards</CardTitle>
                  <CardDescription>
                    Create custom boards to collect feedback from users and stakeholders.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Create multiple boards for different projects</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Organize feedback by categories and tags</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Public or private visibility options</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="rounded-full bg-primary/10 p-3 w-fit mb-3">
                    <ThumbsUp className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Voting System</CardTitle>
                  <CardDescription>
                    Let users vote on feedback to help you prioritize what matters most.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Upvote and downvote functionality</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Sort feedback by popularity</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Track voting trends over time</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="rounded-full bg-primary/10 p-3 w-fit mb-3">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Team Collaboration</CardTitle>
                  <CardDescription>
                    Work together with your team to respond to feedback and keep users updated.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Assign team members to feedback items</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Comment and discuss internally</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Role-based permissions</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="rounded-full bg-primary/10 p-3 w-fit mb-3">
                    <Github className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>GitHub Integration</CardTitle>
                  <CardDescription>Connect your feedback directly to your development workflow.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Link feedback to GitHub issues</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Sync status updates automatically</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Keep users informed of development progress</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="rounded-full bg-primary/10 p-3 w-fit mb-3">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Polls & Surveys</CardTitle>
                  <CardDescription>
                    Gather structured feedback through polls and get quantitative insights.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Create custom polls with multiple options</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Visualize results with charts</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Share polls with specific audiences</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="rounded-full bg-primary/10 p-3 w-fit mb-3">
                    <Megaphone className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Announcements</CardTitle>
                  <CardDescription>Keep your community informed with important updates and news.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Create highlighted announcements</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Pin important messages to the top</span>
                    </li>
                    <li className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      <span>Notify users of updates</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="mt-16 flex justify-center">
              <Link href="/signup">
                <Button size="lg">Get Started for Free</Button>
              </Link>
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
