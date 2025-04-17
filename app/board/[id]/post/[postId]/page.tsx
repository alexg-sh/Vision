"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ThumbsDown, ThumbsUp, Github } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"

export default function PostDetailPage({ params }: { params: { id: string; postId: string } }) {
  const router = useRouter()
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock post data
  const [post, setPost] = useState({
    id: Number.parseInt(params.postId),
    title: "Add dark mode support",
    description:
      "It would be great to have a dark mode option for the dashboard. This would help reduce eye strain when using the application in low-light environments.",
    votes: 15,
    status: "planned",
    author: {
      name: "John Doe",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "member",
    },
    userVote: 1, // 1 = upvote, -1 = downvote, 0 = no vote
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    githubIssue: {
      linked: true,
      number: 42,
      url: "https://github.com/acme/project-vision/issues/42",
      status: "open",
    },
  })

  // Mock comments data
  const [comments, setComments] = useState([
    {
      id: 1,
      content:
        "I agree, dark mode would be a great addition. It would also be nice to have an auto-switch based on system preferences.",
      author: {
        name: "Jane Smith",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "moderator",
      },
      votes: 8,
      userVote: 0,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      replies: [
        {
          id: 3,
          content: "System preference detection is already on our roadmap. We'll consider bundling it with dark mode.",
          author: {
            name: "Admin User",
            avatar: "/placeholder.svg?height=40&width=40",
            role: "admin",
          },
          votes: 3,
          userVote: 0,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
        },
      ],
    },
    {
      id: 2,
      content: "Could we also get a high contrast mode for accessibility?",
      author: {
        name: "Mike Wilson",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "member",
      },
      votes: 5,
      userVote: 1,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
      replies: [],
    },
  ])

  const handleVote = (postId: number, voteType: 1 | -1) => {
    setPost((post) => {
      // If already voted the same way, remove vote
      if (post.userVote === voteType) {
        return {
          ...post,
          votes: post.votes - voteType,
          userVote: 0,
        }
      }
      // If voted the opposite way, change vote (counts as 2)
      else if (post.userVote !== 0) {
        return {
          ...post,
          votes: post.votes + voteType * 2,
          userVote: voteType,
        }
      }
      // If not voted yet, add vote
      else {
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
          // If already voted the same way, remove vote
          if (comment.userVote === voteType) {
            return {
              ...comment,
              votes: comment.votes - voteType,
              userVote: 0,
            }
          }
          // If voted the opposite way, change vote (counts as 2)
          else if (comment.userVote !== 0) {
            return {
              ...comment,
              votes: comment.votes + voteType * 2,
              userVote: voteType,
            }
          }
          // If not voted yet, add vote
          else {
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
                // If already voted the same way, remove vote
                if (reply.userVote === voteType) {
                  return {
                    ...reply,
                    votes: reply.votes - voteType,
                    userVote: 0,
                  }
                }
                // If voted the opposite way, change vote (counts as 2)
                else if (reply.userVote !== 0) {
                  return {
                    ...reply,
                    votes: reply.votes + voteType * 2,
                    userVote: voteType,
                  }
                }
                // If not voted yet, add vote
                else {
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

  const handleAddComment = () => {
    if (newComment.trim()) {
      setIsSubmitting(true)

      // Simulate API call
      setTimeout(() => {
        const newCommentObj = {
          id: Math.max(...comments.map((c) => c.id)) + 1,
          content: newComment,
          author: {
            name: "You",
            avatar: "/placeholder.svg?height=40&width=40",
            role: "member",
          },
          votes: 1,
          userVote: 1,
          createdAt: new Date().toISOString(),
          replies: [],
        }

        setComments([...comments, newCommentObj])
        setNewComment("")
        setIsSubmitting(false)
      }, 500)
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
          <Button variant="ghost" size="icon" onClick={() => router.push(`/board/${params.id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Post Details</h1>
        </div>

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
                          className={`ml-1 px-1.5 py-0.5 rounded-sm text-xs ${getGitHubStatusColor(post.githubIssue.status)}`}
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

                      {comment.replies.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
                          {comment.replies.map((reply) => (
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
