"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  MessageSquare,
  Plus,
  Settings,
  ThumbsDown,
  ThumbsUp,
  Lock,
  UserPlus,
  Mail,
  MoreHorizontal,
  Trash2,
  Github,
  LinkIcon,
  BarChart3,
  Megaphone,
  PieChart,
} from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"

export default function BoardPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostDescription, setNewPostDescription] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [postToDelete, setPostToDelete] = useState<number | null>(null)
  const [postType, setPostType] = useState<"feedback" | "poll" | "announcement">("feedback")
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""])

  // Mock board data
  const [board, setBoard] = useState({
    id: Number.parseInt(params.id),
    name: "Feature Requests",
    description: "Collect and prioritize feature ideas from users",
    image: "/placeholder.svg?height=400&width=1200",
    isPrivate: Number.parseInt(params.id) % 2 === 0, // Even IDs are private for demo
    members: 5,
    githubConnected: true,
    githubRepo: "acme/project-vision",
  })

  // Mock user role - in a real app, this would come from auth
  const [userRole, setUserRole] = useState("admin") // admin, moderator, member

  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "Add dark mode support",
      description: "It would be great to have a dark mode option for the dashboard.",
      type: "feedback",
      votes: 15,
      comments: 3,
      status: "planned",
      author: {
        name: "John Doe",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "member",
      },
      userVote: 1, // 1 = upvote, -1 = downvote, 0 = no vote
      githubIssue: {
        linked: true,
        number: 42,
        status: "open",
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    },
    {
      id: 2,
      title: "Improve mobile responsiveness",
      description: "The app doesn't work well on mobile devices. Please improve the mobile experience.",
      type: "feedback",
      votes: 8,
      comments: 2,
      status: "in-progress",
      author: {
        name: "Jane Smith",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "moderator",
      },
      userVote: 0,
      githubIssue: {
        linked: true,
        number: 56,
        status: "in-progress",
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    },
    {
      id: 3,
      title: "Important: Upcoming maintenance",
      description: "The system will be down for maintenance on Saturday from 2-4 AM EST for server upgrades.",
      type: "announcement",
      votes: 0,
      comments: 1,
      status: "none",
      author: {
        name: "Admin User",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "admin",
      },
      userVote: 0,
      githubIssue: {
        linked: false,
        number: null,
        status: null,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    },
    {
      id: 4,
      title: "Which feature should we prioritize next?",
      description: "We want your input on which feature we should focus on for the next development cycle.",
      type: "poll",
      votes: 0,
      comments: 4,
      status: "none",
      author: {
        name: "Jane Smith",
        avatar: "/placeholder.svg?height=40&width=40",
        role: "moderator",
      },
      userVote: 0,
      githubIssue: {
        linked: false,
        number: null,
        status: null,
      },
      pollOptions: [
        { id: 1, text: "User profiles", votes: 12 },
        { id: 2, text: "Notifications", votes: 8 },
        { id: 3, text: "Mobile app", votes: 15 },
        { id: 4, text: "API access", votes: 5 },
      ],
      userPollVote: 3, // ID of the option the user voted for, null if not voted
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
    },
  ])

  // Function to check if user can delete a post
  const canDeletePost = (post: any) => {
    // Admins can delete any post
    if (userRole === "admin") return true
    // Moderators can delete posts from members
    if (userRole === "moderator" && post.author.role === "member") return true
    // Users can delete their own posts (not implemented in this demo)
    return false
  }

  // Function to check if user can create announcements
  const canCreateAnnouncement = () => {
    return userRole === "admin" || userRole === "moderator"
  }

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, ""])
  }

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions]
      newOptions.splice(index, 1)
      setPollOptions(newOptions)
    }
  }

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions]
    newOptions[index] = value
    setPollOptions(newOptions)
  }

  const handleCreatePost = () => {
    if (newPostTitle.trim()) {
      const newPost: any = {
        id: Math.max(...posts.map((p) => p.id)) + 1,
        title: newPostTitle,
        description: newPostDescription,
        type: postType,
        votes: postType === "feedback" ? 1 : 0,
        comments: 0,
        status: postType === "feedback" ? "planned" : "none",
        author: {
          name: "You",
          avatar: "/placeholder.svg?height=40&width=40",
          role: userRole,
        },
        userVote: postType === "feedback" ? 1 : 0,
        githubIssue: {
          linked: false,
          number: null,
          status: null,
        },
        createdAt: new Date().toISOString(),
      }

      if (postType === "poll") {
        const validOptions = pollOptions.filter((option) => option.trim() !== "")
        if (validOptions.length < 2) {
          alert("Please add at least two poll options")
          return
        }
        newPost.pollOptions = validOptions.map((text, index) => ({
          id: index + 1,
          text,
          votes: 0,
        }))
        newPost.userPollVote = null
      }

      setPosts([newPost, ...posts])
      setNewPostTitle("")
      setNewPostDescription("")
      setPostType("feedback")
      setPollOptions(["", ""])
      setIsDialogOpen(false)

      // In a real app, this would add to the audit log
    }
  }

  const handleInviteUser = () => {
    if (inviteEmail.trim()) {
      // In a real app, this would send an invitation to the user
      alert(`Invitation sent to ${inviteEmail}`)
      setInviteEmail("")
      setIsInviteDialogOpen(false)

      // In a real app, this would add to the audit log
    }
  }

  const handleDeletePost = (postId: number) => {
    setPosts(posts.filter((post) => post.id !== postId))
    setPostToDelete(null)

    // In a real app, this would add to the audit log
  }

  const handleVote = (postId: number, voteType: 1 | -1) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
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
        }
        return post
      }),
    )
  }

  const handlePollVote = (postId: number, optionId: number) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId && post.type === "poll") {
          // If already voted for this option, remove vote
          if (post.userPollVote === optionId) {
            return {
              ...post,
              pollOptions: post.pollOptions.map((option: any) => ({
                ...option,
                votes: option.id === optionId ? option.votes - 1 : option.votes,
              })),
              userPollVote: null,
            }
          }
          // If voted for a different option, change vote
          else if (post.userPollVote !== null) {
            return {
              ...post,
              pollOptions: post.pollOptions.map((option: any) => ({
                ...option,
                votes:
                  option.id === optionId
                    ? option.votes + 1
                    : option.id === post.userPollVote
                      ? option.votes - 1
                      : option.votes,
              })),
              userPollVote: optionId,
            }
          }
          // If not voted yet, add vote
          else {
            return {
              ...post,
              pollOptions: post.pollOptions.map((option: any) => ({
                ...option,
                votes: option.id === optionId ? option.votes + 1 : option.votes,
              })),
              userPollVote: optionId,
            }
          }
        }
        return post
      }),
    )
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
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "closed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "announcement":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "poll":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="relative w-full h-64">
        <Image src={board.image || "/placeholder.svg"} alt={board.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div className="container p-6">
            <div className="flex items-center gap-2 mb-2">
              {board.isPrivate && (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Private Board
                </Badge>
              )}
              {board.githubConnected && (
                <Badge variant="outline" className="gap-1 bg-white/20 text-white border-white/40">
                  <Github className="h-3 w-3" />
                  {board.githubRepo}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white">{board.name}</h1>
            <p className="text-white/80 max-w-2xl">{board.description}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 container py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{posts.length} posts</span>
            </div>
            <div className="flex items-center gap-1">
              <Avatar className="h-6 w-6">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <span>{board.members} members</span>
            </div>
          </div>

          <div className="flex gap-2">
            {board.isPrivate && (
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Members
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite members to this board</DialogTitle>
                    <DialogDescription>
                      Send invitations to people you want to collaborate with on this private board.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email address</Label>
                      <div className="flex gap-2">
                        <Input
                          id="invite-email"
                          placeholder="colleague@example.com"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <Button onClick={handleInviteUser}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>You can also share this private invitation link:</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          value={`https://projectvision.com/invite/${board.id}/${Math.random().toString(36).substring(2, 10)}`}
                          readOnly
                        />
                        <Button variant="outline" size="sm">
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Create a new post</DialogTitle>
                  <DialogDescription>Share your feedback, ideas, or create a poll.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Post type</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={postType === "feedback" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setPostType("feedback")}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Feedback
                      </Button>
                      <Button
                        variant={postType === "poll" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setPostType("poll")}
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Poll
                      </Button>
                      {canCreateAnnouncement() && (
                        <Button
                          variant={postType === "announcement" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => setPostType("announcement")}
                        >
                          <Megaphone className="mr-2 h-4 w-4" />
                          Announcement
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="post-title">Title</Label>
                    <Input
                      id="post-title"
                      placeholder={
                        postType === "feedback"
                          ? "e.g., Add dark mode support"
                          : postType === "poll"
                            ? "e.g., Which feature should we build next?"
                            : "e.g., Important: Upcoming maintenance"
                      }
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="post-description">Description</Label>
                    <Textarea
                      id="post-description"
                      placeholder={
                        postType === "feedback"
                          ? "Provide more details about your idea..."
                          : postType === "poll"
                            ? "Explain what you're asking about..."
                            : "Share important information with the community..."
                      }
                      value={newPostDescription}
                      onChange={(e) => setNewPostDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {postType === "poll" && (
                    <div className="space-y-3">
                      <Label>Poll options</Label>
                      {pollOptions.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            placeholder={`Option ${index + 1}`}
                            value={option}
                            onChange={(e) => handlePollOptionChange(index, e.target.value)}
                          />
                          {pollOptions.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePollOption(index)}
                              className="shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={handleAddPollOption}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Option
                      </Button>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePost}>Post</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={() => router.push(`/board/${params.id}/settings`)}>
              <Settings className="mr-2 h-4 w-4" />
              Board Settings
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="polls">Polls</TabsTrigger>
            {board.githubConnected && <TabsTrigger value="github">GitHub Issues</TabsTrigger>}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="mb-4">
                <CardContent className="p-6">
                  {post.type === "feedback" && (
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
                          <Link href={`/board/${params.id}/post/${post.id}`} className="hover:underline">
                            <h3 className="text-lg font-medium">{post.title}</h3>
                          </Link>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(post.status)}>{post.status.replace("-", " ")}</Badge>
                            {post.githubIssue?.linked && (
                              <Badge variant="outline" className="gap-1">
                                <Github className="h-3 w-3" />#{post.githubIssue.number}
                                <span
                                  className={`ml-1 px-1.5 py-0.5 rounded-sm text-xs ${getGitHubStatusColor(
                                    post.githubIssue.status,
                                  )}`}
                                >
                                  {post.githubIssue.status}
                                </span>
                              </Badge>
                            )}
                            {canDeletePost(post) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={() => setPostToDelete(post.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Post
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(post.createdAt)}
                            </span>
                          </div>
                          <Link href={`/board/${params.id}/post/${post.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {post.comments} Comments
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {post.type === "announcement" && (
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className="rounded-full bg-red-100 dark:bg-red-900 p-2">
                          <Megaphone className="h-5 w-5 text-red-600 dark:text-red-300" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getPostTypeColor("announcement")}>Announcement</Badge>
                            <Link href={`/board/${params.id}/post/${post.id}`} className="hover:underline">
                              <h3 className="text-lg font-medium">{post.title}</h3>
                            </Link>
                          </div>
                          {canDeletePost(post) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={() => setPostToDelete(post.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Post
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
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
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(post.createdAt)}
                            </span>
                          </div>
                          <Link href={`/board/${params.id}/post/${post.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {post.comments} Comments
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {post.type === "poll" && (
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2">
                          <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getPostTypeColor("poll")}>Poll</Badge>
                            <Link href={`/board/${params.id}/post/${post.id}`} className="hover:underline">
                              <h3 className="text-lg font-medium">{post.title}</h3>
                            </Link>
                          </div>
                          {canDeletePost(post) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={() => setPostToDelete(post.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Poll
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">{post.description}</p>

                        <div className="space-y-3 mb-4">
                          <RadioGroup
                            value={post.userPollVote?.toString() || ""}
                            onValueChange={(value) => handlePollVote(post.id, Number.parseInt(value))}
                          >
                            {post.pollOptions.map((option: any) => {
                              const totalVotes = post.pollOptions.reduce((sum: number, opt: any) => sum + opt.votes, 0)
                              const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
                              return (
                                <div key={option.id} className="space-y-1">
                                  <div className="flex items-center">
                                    <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
                                    <Label htmlFor={`option-${option.id}`} className="ml-2 flex-1">
                                      {option.text}
                                    </Label>
                                    <span className="text-sm font-medium">
                                      {option.votes} votes ({percentage}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div
                                      className="bg-primary h-2.5 rounded-full"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )
                            })}
                          </RadioGroup>
                        </div>

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
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(post.createdAt)}
                            </span>
                          </div>
                          <Link href={`/board/${params.id}/post/${post.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {post.comments} Comments
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            {posts
              .filter((post) => post.type === "feedback")
              .map((post) => (
                <Card key={post.id} className="mb-4">
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
                          <Link href={`/board/${params.id}/post/${post.id}`} className="hover:underline">
                            <h3 className="text-lg font-medium">{post.title}</h3>
                          </Link>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(post.status)}>{post.status.replace("-", " ")}</Badge>
                            {post.githubIssue?.linked && (
                              <Badge variant="outline" className="gap-1">
                                <Github className="h-3 w-3" />#{post.githubIssue.number}
                              </Badge>
                            )}
                            {canDeletePost(post) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setPostToDelete(post.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(post.createdAt)}
                            </span>
                          </div>
                          <Link href={`/board/${params.id}/post/${post.id}`}>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {post.comments} Comments
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4">
            {posts.filter((post) => post.type === "announcement").length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <h3 className="text-lg font-medium mb-2">No announcements yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  When announcements are posted, they will appear here.
                </p>
                {canCreateAnnouncement() && (
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setPostType("announcement")
                      setIsDialogOpen(true)
                    }}
                  >
                    <Megaphone className="mr-2 h-4 w-4" />
                    Create Announcement
                  </Button>
                )}
              </div>
            ) : (
              posts
                .filter((post) => post.type === "announcement")
                .map((post) => (
                  <Card key={post.id} className="mb-4">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <div className="rounded-full bg-red-100 dark:bg-red-900 p-2">
                            <Megaphone className="h-5 w-5 text-red-600 dark:text-red-300" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getPostTypeColor("announcement")}>Announcement</Badge>
                              <Link href={`/board/${params.id}/post/${post.id}`} className="hover:underline">
                                <h3 className="text-lg font-medium">{post.title}</h3>
                              </Link>
                            </div>
                            {canDeletePost(post) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setPostToDelete(post.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(post.createdAt)}
                              </span>
                            </div>
                            <Link href={`/board/${params.id}/post/${post.id}`}>
                              <Button variant="ghost" size="sm" className="gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {post.comments} Comments
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          <TabsContent value="polls" className="space-y-4">
            {posts.filter((post) => post.type === "poll").length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <h3 className="text-lg font-medium mb-2">No polls yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  When polls are created, they will appear here.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setPostType("poll")
                    setIsDialogOpen(true)
                  }}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Create Poll
                </Button>
              </div>
            ) : (
              posts
                .filter((post) => post.type === "poll")
                .map((post) => (
                  <Card key={post.id} className="mb-4">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2">
                            <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getPostTypeColor("poll")}>Poll</Badge>
                              <Link href={`/board/${params.id}/post/${post.id}`} className="hover:underline">
                                <h3 className="text-lg font-medium">{post.title}</h3>
                              </Link>
                            </div>
                            {canDeletePost(post) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setPostToDelete(post.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 mb-4">{post.description}</p>

                          <div className="space-y-3 mb-4">
                            <RadioGroup
                              value={post.userPollVote?.toString() || ""}
                              onValueChange={(value) => handlePollVote(post.id, Number.parseInt(value))}
                            >
                              {post.pollOptions.map((option: any) => {
                                const totalVotes = post.pollOptions.reduce(
                                  (sum: number, opt: any) => sum + opt.votes,
                                  0,
                                )
                                const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
                                return (
                                  <div key={option.id} className="space-y-1">
                                    <div className="flex items-center">
                                      <RadioGroupItem
                                        value={option.id.toString()}
                                        id={`option-${post.id}-${option.id}`}
                                      />
                                      <Label htmlFor={`option-${post.id}-${option.id}`} className="ml-2 flex-1">
                                        {option.text}
                                      </Label>
                                      <span className="text-sm font-medium">
                                        {option.votes} votes ({percentage}%)
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                      <div
                                        className="bg-primary h-2.5 rounded-full"
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )
                              })}
                            </RadioGroup>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-500 dark:text-gray-400">{post.author.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(post.createdAt)}
                              </span>
                            </div>
                            <Link href={`/board/${params.id}/post/${post.id}`}>
                              <Button variant="ghost" size="sm" className="gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {post.comments} Comments
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          {board.githubConnected && (
            <TabsContent value="github">
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Github className="h-5 w-5" />
                      <h3 className="text-lg font-medium">GitHub Integration</h3>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <span className="font-mono">{board.githubRepo}</span>
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    This board is connected to GitHub. Issues from the repository are synced with this board.
                  </p>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/board/${params.id}/settings?tab=github`)}
                    >
                      Manage GitHub Integration
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {[
                  {
                    id: 42,
                    title: "Add dark mode support",
                    description: "Implement dark mode across the entire application",
                    status: "open",
                    labels: ["enhancement", "ui"],
                    assignee: "johndoe",
                    createdAt: "2023-04-15T10:30:00Z",
                    linkedPost: 1,
                  },
                  {
                    id: 56,
                    title: "Improve mobile responsiveness",
                    description: "Fix layout issues on mobile devices",
                    status: "in-progress",
                    labels: ["bug", "priority-high"],
                    assignee: "janesmith",
                    createdAt: "2023-04-18T14:20:00Z",
                    linkedPost: 2,
                  },
                  {
                    id: 78,
                    title: "Add user profile settings",
                    description: "Create a page for users to manage their profile settings",
                    status: "open",
                    labels: ["feature", "user-experience"],
                    assignee: null,
                    createdAt: "2023-04-20T09:15:00Z",
                    linkedPost: null,
                  },
                ].map((issue) => (
                  <Card key={issue.id} className="mb-4">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Github className="h-4 w-4" />
                          <a
                            href={`https://github.com/${board.githubRepo}/issues/${issue.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-lg font-medium hover:underline"
                          >
                            {issue.title} <span className="text-muted-foreground">#{issue.id}</span>
                          </a>
                        </div>
                        <Badge className={getGitHubStatusColor(issue.status)}>{issue.status}</Badge>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">{issue.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {issue.labels.map((label) => (
                          <Badge key={label} variant="outline" className="capitalize">
                            {label}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {issue.assignee ? (
                            <>
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>{issue.assignee.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-500 dark:text-gray-400">@{issue.assignee}</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">Unassigned</span>
                          )}
                        </div>
                        {issue.linkedPost ? (
                          <Link href={`/board/${params.id}/post/${issue.linkedPost}`}>
                            <Button variant="outline" size="sm" className="gap-1">
                              <MessageSquare className="h-4 w-4" />
                              View Feedback Post
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="outline" size="sm" className="gap-1">
                            <LinkIcon className="h-4 w-4" />
                            Link to Feedback
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Delete Post Confirmation Dialog */}
      <AlertDialog open={postToDelete !== null} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => postToDelete && handleDeletePost(postToDelete)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
