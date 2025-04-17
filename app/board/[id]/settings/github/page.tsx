"use client"

import Link from "next/link"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Github, RefreshCw, LinkIcon } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"

export default function GitHubIntegrationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isConnected, setIsConnected] = useState(true)
  const [repoUrl, setRepoUrl] = useState("acme/project-vision")
  const [syncFrequency, setSyncFrequency] = useState("hourly")
  const [autoLinkIssues, setAutoLinkIssues] = useState(true)
  const [syncLabels, setSyncLabels] = useState(true)
  const [syncComments, setSyncComments] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState("2023-04-22T15:30:00Z")

  // Mock GitHub issues
  const [linkedIssues, setLinkedIssues] = useState([
    {
      id: 42,
      title: "Add dark mode support",
      status: "open",
      linkedPost: {
        id: 1,
        title: "Add dark mode support",
      },
    },
    {
      id: 56,
      title: "Improve mobile responsiveness",
      status: "in-progress",
      linkedPost: {
        id: 2,
        title: "Improve mobile responsiveness",
      },
    },
  ])

  const handleSyncNow = () => {
    setIsSyncing(true)

    // Simulate API call
    setTimeout(() => {
      setIsSyncing(false)
      setLastSynced(new Date().toISOString())
    }, 2000)
  }

  const handleDisconnect = () => {
    // In a real app, this would call an API to disconnect the GitHub integration
    setIsConnected(false)
  }

  const handleConnect = () => {
    // In a real app, this would redirect to GitHub OAuth flow
    setIsConnected(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/board/${params.id}/settings`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            <h1 className="text-2xl font-bold">GitHub Integration</h1>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>GitHub Repository Connection</CardTitle>
                <CardDescription>Connect your board to a GitHub repository to sync issues.</CardDescription>
              </div>
              {isConnected ? (
                <Badge
                  variant="outline"
                  className="gap-1 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800"
                >
                  Connected
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="gap-1 bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                >
                  Disconnected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected ? (
              <>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    <span className="font-medium">{repoUrl}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Last synced: {formatDate(lastSynced)}</div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="sync-frequency">Sync Frequency</Label>
                    <select
                      id="sync-frequency"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={syncFrequency}
                      onChange={(e) => setSyncFrequency(e.target.value)}
                    >
                      <option value="realtime">Real-time</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="manual">Manual only</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="auto-link" checked={autoLinkIssues} onCheckedChange={setAutoLinkIssues} />
                    <Label htmlFor="auto-link">Automatically link new issues to matching feedback posts</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="sync-labels" checked={syncLabels} onCheckedChange={setSyncLabels} />
                    <Label htmlFor="sync-labels">Sync labels between GitHub and board</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="sync-comments" checked={syncComments} onCheckedChange={setSyncComments} />
                    <Label htmlFor="sync-comments">Sync comments between GitHub issues and feedback posts</Label>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handleDisconnect}>
                    Disconnect Repository
                  </Button>
                  <Button onClick={handleSyncNow} disabled={isSyncing}>
                    {isSyncing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync Now
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Github className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Connect to GitHub</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Connect your board to a GitHub repository to sync issues and streamline your workflow.
                </p>
                <Button onClick={handleConnect}>
                  <Github className="mr-2 h-4 w-4" />
                  Connect GitHub Repository
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Linked GitHub Issues</CardTitle>
              <CardDescription>GitHub issues that are linked to feedback posts on this board.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {linkedIssues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No linked GitHub issues yet</p>
                  </div>
                ) : (
                  linkedIssues.map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Github className="h-4 w-4" />
                        <a
                          href={`https://github.com/${repoUrl}/issues/${issue.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline"
                        >
                          {issue.title} <span className="text-muted-foreground">#{issue.id}</span>
                        </a>
                        <Badge variant="outline" className="capitalize">
                          {issue.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Linked to:{" "}
                          <Link href={`/board/${params.id}/post/${issue.linkedPost.id}`} className="hover:underline">
                            {issue.linkedPost.title}
                          </Link>
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button variant="outline" onClick={() => router.push(`/board/${params.id}?tab=github`)}>
                View All GitHub Issues
              </Button>
            </CardFooter>
          </Card>
        )}
      </main>
    </div>
  )
}
