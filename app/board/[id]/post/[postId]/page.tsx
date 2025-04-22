"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ThumbsDown, ThumbsUp, Github } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"

export default function PostDetailPage({ params: paramsPromise }: { params: Promise<{ id: string; postId: string }> }) {
  const params = use(paramsPromise)
  const boardId = params.id
  const postId = params.postId
  const router = useRouter()
  const [post, setPost] = useState<any | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/boards/${boardId}/posts/${postId}`),
        fetch(`/api/boards/${boardId}/posts/${postId}/comments`),
      ])
      if (postRes.ok) {
        setPost(await postRes.json())
      }
      if (commentsRes.ok) {
        setComments(await commentsRes.json())
      }
    }
    fetchData()
  }, [boardId, postId])

  const handleVote = (postId: number, voteType: 1 | -1) => {
    setPost((post) => {
      if (post.userVote === voteType) {
        return {
          ...post,
          votes: post.votes - voteType,
          userVote: 0,
        }
      } else if (post.userVote !== 0) {
        return {
          ...post,
          votes: post.votes + voteType * 2,
          userVote: voteType,
        }
      } else {
        return {
          ...post,
          votes: post.votes + voteType,
          userVote: voteType,
        }
      }
    })
  }

  const handleCommentVote = (commentId: number, voteType: 1 | -1) => {
    setComments((comments) =>
      comments.map((comment) => {
        if (comment.id === commentId) {
          if (comment.userVote === voteType) {
            return {
              ...comment,
              votes: comment.votes - voteType,
              userVote: 0,
            }
          } else if (comment.userVote !== 0) {
            return {
              ...comment,
              votes: comment.votes + voteType * 2,
              userVote: voteType,
            }
          } else {
            return {
              ...comment,
              votes: comment.votes + voteType,
              userVote: voteType,
            }
          }
        }
        return comment
      }),
    )
  }

  const handleReplyVote = (commentId: number, replyId: number, voteType: 1 | -1) => {
    setComments((comments) =>
      comments.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: comment.replies.map((reply) => {
              if (reply.id === replyId) {
                if (reply.userVote === voteType) {
                  return {
                    ...reply,
                    votes: reply.votes - voteType,
                    userVote: 0,
                  }
                } else if (reply.userVote !== 0) {
                  return {
                    ...reply,
                    votes: reply.votes + voteType * 2,
                    userVote: voteType,
                  }
                } else {
                  return {
                    ...reply,
                    votes: reply.votes + voteType,
                    userVote: voteType,
                  }
                }
              }
              return reply
            }),
          }
        }
        return comment
      }),
    )
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/boards/${boardId}/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })
      if (res.ok) {
        const created = await res.json()
        setComments((prev) => [...prev, created])
        setNewComment("")
      }
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
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
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
                    onClick={() => handleVote(post.id, 1)}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{post.votes}</span>
                  <Button
                    size="icon"
                    variant={post.userVote === -1 ? "default" : "ghost"}
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleVote(post.id, -1)}
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
    </div>
  )
}
