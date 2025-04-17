import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { MessageSquare, Mail, FileQuestion, BookOpen, MessageCircle, HelpCircle } from "lucide-react"

export default function SupportPage() {
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
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">How Can We Help You?</h1>
                <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  We're here to help you get the most out of Project Vision. Browse our resources or contact our support
                  team.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <div className="relative">
                  <HelpCircle className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search for help..."
                    className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
              <div>
                <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>How do I create a new board?</AccordionTrigger>
                    <AccordionContent>
                      To create a new board, navigate to your dashboard and click the "Create Board" button. Fill in the
                      board details such as name, description, and privacy settings, then click "Create".
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>How do I invite team members?</AccordionTrigger>
                    <AccordionContent>
                      You can invite team members to your organization or specific boards. Go to the organization or
                      board settings, click "Invite Members", and enter their email addresses. They'll receive an
                      invitation to join.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>How does the GitHub integration work?</AccordionTrigger>
                    <AccordionContent>
                      Our GitHub integration allows you to link feedback posts to GitHub issues. Connect your GitHub
                      repository in the board settings, then you can create or link issues directly from feedback posts.
                      Status updates will sync automatically.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>What are the different user roles?</AccordionTrigger>
                    <AccordionContent>
                      Project Vision has three main roles: Admin, Moderator, and Member. Admins have full control over
                      the organization and boards. Moderators can manage content and users. Members can post and comment
                      on feedback.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger>How do I create a poll?</AccordionTrigger>
                    <AccordionContent>
                      To create a poll, go to any board and click "New Post". Select "Poll" as the post type, add your
                      question and options, then publish. Users can vote on the options and you can view the results in
                      real-time.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Contact Support</h2>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Support
                      </CardTitle>
                      <CardDescription>Get help from our support team</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">Our support team is available Monday through Friday, 9am-5pm EST.</p>
                      <Button className="w-full">
                        <Mail className="mr-2 h-4 w-4" />
                        Contact Support
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-6">Resources</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Documentation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Detailed guides and documentation for all features
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          View Docs
                        </Button>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileQuestion className="h-5 w-5" />
                          Tutorials
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Step-by-step tutorials to get started quickly
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          View Tutorials
                        </Button>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MessageCircle className="h-5 w-5" />
                          Community Forum
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Connect with other users and share tips</p>
                        <Button variant="outline" size="sm" className="w-full">
                          Join Forum
                        </Button>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <HelpCircle className="h-5 w-5" />
                          API Reference
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Technical documentation for developers</p>
                        <Button variant="outline" size="sm" className="w-full">
                          View API Docs
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
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
