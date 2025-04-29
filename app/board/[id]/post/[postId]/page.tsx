"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ThumbsDown, ThumbsUp, Github } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Define interfaces for data structures
interface Author {
  name: string;
  avatar?: string;
  role: string;
}

interface GitHubIssue {
  linked: boolean;
  url: string;
  number: number;
  status: string;
}

interface Post {
  id: string;
  title: string;
  description: string;
  status: string;
  votes: number;
  userVote: number | null;
  createdAt: string;
  author: Author;
  githubIssue?: GitHubIssue;
}

interface Reply {
  id: string;
  content: string;
  votes: number;
  userVote: number | null;
  createdAt: string;
  author: Author;
}

interface Comment {
  id: string;
  content: string;
  votes: number;
  userVote: number | null;
  createdAt: string;
  author: Author;
  replies?: Reply[];
}

export default function PostDetailPage({ params: paramsPromise }: { params: Promise<{ id: string; postId: string }> }) {
  const params = use(paramsPromise)
  const boardId = params.id
  const postId = params.postId
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // GitHub integration state
  const { toast } = useToast()
  const [repoEnabled, setRepoEnabled] = useState(false)
  const [issues, setIssues] = useState<Array<{ number: number; title: string; url: string }>>([])
  const [issuesLoading, setIssuesLoading] = useState(false)
  const [issuesError, setIssuesError] = useState<string | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<number | null>(null)

  useEffect(() => {
    async function fetchData() {
      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/boards/${boardId}/posts/${postId}`, { credentials: 'same-origin' }),
        fetch(`/api/boards/${boardId}/posts/${postId}/comments`, { credentials: 'same-origin' }),
      ])
      if (postRes.ok) {
        setPost(await postRes.json())
      }
      if (commentsRes.ok) {
        setComments(await commentsRes.json())
      }
    }
    fetchData()

    // Load GitHub issues if board integration enabled
    async function loadIntegration() {
      try {
        const res = await fetch(`/api/boards/${boardId}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.githubEnabled) {
          setRepoEnabled(true)
          setIssuesLoading(true)
          const ir = await fetch(`/api/boards/${boardId}/github/issues`)
          if (ir.ok) {
            setIssues(await ir.json())
          } else {
            setIssuesError('Failed to load GitHub issues')
          }
        }
      } catch (err: any) {
        setIssuesError(err.message)
      } finally {
        setIssuesLoading(false)
      }
    }
    loadIntegration()
  }, [boardId, postId])

  const handleVote = async (voteType: 1 | -1) => {
    try {
      const res = await fetch(`/api/boards/${boardId}/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ voteType }),
      })
      if (res.ok) {
        const { votes, userVote } = await res.json()
        setPost((post) => post && { ...post, votes, userVote })
      } else {
        console.error("Post vote failed:", res.status, await res.text())
      }
    } catch (err) {
      console.error("Vote error", err)
    }
  }

  const handleCommentVote = async (commentId: string, voteType: 1 | -1) => {
    try {
      const res = await fetch(`/api/boards/${boardId}/posts/${postId}/comments/${commentId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ voteType }),
      })
      if (res.ok) {
        const { votes, userVote } = await res.json()
        setComments((comments) =>
          comments.map((comment) => (comment.id === commentId ? { ...comment, votes, userVote } : comment)),
        )
      } else {
        console.error("Comment vote failed:", res.status, await res.text())
      }
    } catch (err) {
      console.error("Comment vote error", err)
    }
  }

  const handleReplyVote = async (commentId: string, replyId: string, voteType: 1 | -1) => {
    try {
      const res = await fetch(`/api/boards/${boardId}/posts/${postId}/comments/${replyId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ voteType }),
      })
      if (res.ok) {
        const { votes, userVote } = await res.json()
        setComments((comments) =>
          comments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  replies: (comment.replies ?? []).map((reply) =>
                    reply.id === replyId ? { ...reply, votes, userVote } : reply,
                  ),
                }
              : comment,
          ),
        )
      } else {
        console.error("Reply vote failed:", res.status, await res.text())
      }
    } catch (err) {
      console.error("Reply vote error", err)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/boards/${boardId}/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ content: newComment }),
      })
      if (!res.ok) {
        console.error("Add comment failed:", res.status, await res.text())
        return
      }
      const created = await res.json()
      setComments((prev) => [...prev, created])
      setNewComment("")
    } catch (err) {
      console.error("Failed to add comment", err)
    } finally {
      setIsSubmitting(false)
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getGitHubStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "closed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "merged":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <main className="flex-1 container py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/board/${boardId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Post Details</h1>
      </div>

      {post && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                <Button
                  size="icon"
                  variant={post.userVote === 1 ? "default" : "ghost"}
                  className="h-8 w-8 rounded-full"
                  onClick={() => handleVote(1)}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">{post.votes}</span>
                <Button
                  size="icon"
                  variant={post.userVote === -1 ? "default" : "ghost"}
                  className="h-8 w-8 rounded-full"
                  onClick={() => handleVote(-1)}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold">{post.title}</h2>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(post.status)}>{post.status.replace("-", " ")}</Badge>
                    {post.githubIssue?.linked && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Github className="h-3 w-3" />
                        <a
                          href={post.githubIssue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          #{post.githubIssue.number}
                        </a>
                        <span
                          className={`ml-1 px-1.5 py-0.5 rounded-sm text-xs ${getGitHubStatusColor(
                            post.githubIssue.status,
                          )}`}
                        >
                          {post.githubIssue.status}
                        </span>
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">{post.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                      <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{post.author.name}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {post.author.role}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(post.createdAt)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {repoEnabled && post && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>GitHub Issue</CardTitle>
          </CardHeader>
          <CardContent>
            {post.githubIssue?.linked ? (
              <div className="flex items-center gap-2">
                <a href={post.githubIssue.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  #{post.githubIssue.number} {post.githubIssue.status}
                </a>
                <Button size="sm" variant="outline" onClick={async () => {
                  try {
                    const res = await fetch(`/api/boards/${boardId}/posts/${postId}/github`, { method: 'DELETE' })
                    if (!res.ok) throw new Error(await res.text())
                    setPost({ ...post, githubIssue: undefined })
                    toast({ title: 'Issue unlinked' })
                  } catch (err: any) { toast({ variant: 'destructive', title: 'Error', description: err.message }) }
                }}>
                  Unlink
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {issuesLoading ? (
                  <span>Loading issues...</span>
                ) : issuesError ? (
                  <span className="text-destructive">{issuesError}</span>
                ) : (
                  <select className="border p-1 rounded" value={selectedIssue ?? ''} onChange={e => setSelectedIssue(Number(e.target.value))}>
                    <option value="">-- select issue --</option>
                    {issues.map(i => <option key={i.number} value={i.number}>#{i.number} {i.title}</option>)}
                  </select>
                )}
                <Button size="sm" disabled={!selectedIssue} onClick={async () => {
                  if (!selectedIssue) return
                  const issue = issues.find(i => i.number === selectedIssue)
                  if (!issue) return
                  try {
                    const res = await fetch(`/api/boards/${boardId}/posts/${postId}/github`, {
                      method: 'PATCH', headers: {'Content-Type':'application/json'},
                      body: JSON.stringify({ issueNumber: issue.number, issueUrl: issue.url, issueStatus: 'OPEN' })
                    })
                    if (!res.ok) throw new Error((await res.json()).message)
                    setPost({ ...post, githubIssue: { linked: true, number: issue.number, url: issue.url, status: 'OPEN' } })
                    toast({ title: 'Issue linked' })
                  } catch (err: any) { toast({ variant: 'destructive', title: 'Error', description: err.message }) }
                }}>
                  Link Issue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-2">Add a comment</h3>
            <Textarea
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="mb-4"
            />
            <div className="flex justify-end">
              <Button onClick={handleAddComment} disabled={!newComment.trim() || isSubmitting}>
                {isSubmitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {comments.map((comment) => (
            <Card key={comment.id} className="mb-4">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-1 min-w-[60px]">
                    <Button
                      size="icon"
                      variant={comment.userVote === 1 ? "default" : "ghost"}
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleCommentVote(comment.id, 1)}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">{comment.votes}</span>
                    <Button
                      size="icon"
                      variant={comment.userVote === -1 ? "default" : "ghost"}
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleCommentVote(comment.id, -1)}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={comment.author.avatar || "/placeholder.svg"} alt={comment.author.name} />
                          <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{comment.author.name}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {comment.author.role}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mb-4">{comment.content}</p>

                    {(comment.replies?.length ?? 0) > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
                        {(comment.replies ?? []).map((reply) => (
                          <div key={reply.id} className="flex gap-4">
                            <div className="flex flex-col items-center gap-1 min-w-[60px]">
                              <Button
                                size="icon"
                                variant={reply.userVote === 1 ? "default" : "ghost"}
                                className="h-8 w-8 rounded-full"
                                onClick={() => handleReplyVote(comment.id, reply.id, 1)}
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <span className="text-sm font-medium">{reply.votes}</span>
                              <Button
                                size="icon"
                                variant={reply.userVote === -1 ? "default" : "ghost"}
                                className="h-8 w-8 rounded-full"
                                onClick={() => handleReplyVote(comment.id, reply.id, -1)}
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage
                                      src={reply.author.avatar || "/placeholder.svg"}
                                      alt={reply.author.name}
                                    />
                                    <AvatarFallback>{reply.author.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{reply.author.name}</span>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {reply.author.role}
                                  </Badge>
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              <p>{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
