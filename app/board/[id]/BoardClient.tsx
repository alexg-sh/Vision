"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, buttonVariants } from "@/components/ui/button"
import PostCreationDialog from "@/components/post-creation-dialog"
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
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
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
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { PostWithClientData, ClientBoardData, PollOption } from "./page"
import BulkActionsToolbar from "@/components/bulk-actions-toolbar"

interface BoardClientProps {
  board: ClientBoardData
  initialPosts: PostWithClientData[]
  userRole: "guest" | "member" | "moderator" | "admin" | "creator"
}

const getCurrentUserId = (): string | null => {
  return "temp_user_id"
}

export default function BoardClient({ board, initialPosts, userRole }: BoardClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [posts, setPosts] = useState<PostWithClientData[]>(initialPosts)
  const [pollSelections, setPollSelections] = useState<Record<string, number>>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<PostWithClientData | null>(null)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const currentUserId = getCurrentUserId()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set())
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const canCreatePost = true
  const canManageBoard = userRole === "admin" || userRole === "moderator" || userRole === "creator"
  const canDeletePost = (postAuthorId: string) =>
    userRole === "admin" || userRole === "moderator" || (currentUserId !== null && postAuthorId === currentUserId)

  const handleVote = async (postId: string, voteType: 1 | -1) => {
    try {
      const res = await fetch(
        `/api/boards/${board.id}/posts/${postId}/vote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ voteType }),
        },
      )
      if (res.ok) {
        const { votes, userVote } = await res.json()
        setPosts((posts) =>
          posts.map((p) =>
            p.id === postId ? { ...p, votes, userVote } : p
          )
        )
      } else {
        console.error('Post vote failed:', res.status, await res.text())
      }
    } catch (err) {
      console.error('Post vote error', err)
    }
  }

  const handlePollVote = (postId: string, optionId: number) => {
    const post = posts.find(p => p.id === postId);
    if (post?.userPollVote != null) return;
    setPollSelections(prev => ({ ...prev, [postId]: optionId }));
  }

  const handlePollSubmit = async (postId: string) => {
    const selectedOptionId = pollSelections[postId];
    if (selectedOptionId == null) return;

    try {
      const res = await fetch(
        `/api/boards/${board.id}/posts/${postId}/poll-vote`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ optionId: selectedOptionId }) }
      );
      if (res.ok) {
        const { pollOptions, userPollVote } = await res.json();
        setPosts(posts.map(p => p.id === postId
          ? { ...p, pollOptions, userPollVote }
          : p
        ));
        setPollSelections(prev => { const { [postId]: _, ...rest } = prev; return rest; });
        toast({ title: 'Vote recorded' });
      } else {
        const errorData = await res.json();
        toast({ variant: 'destructive', title: 'Vote failed', description: errorData.message || 'Could not record vote.' });
        setPollSelections(prev => { const { [postId]: _, ...rest } = prev; return rest; });
      }
    } catch (err) {
      console.error('Poll vote error', err);
      toast({ variant: 'destructive', title: 'Vote failed' });
      setPollSelections(prev => { const { [postId]: _, ...rest } = prev; return rest; });
    }
  };

  const handleDeletePost = (post: PostWithClientData) => {
    setPostToDelete(post)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeletePost = async () => {
    if (!postToDelete) return
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setPosts(posts.filter((p) => p.id !== postToDelete.id))
      toast({ title: "Post deleted" })
    } catch (error) {
      console.error("Failed to delete post:", error)
      toast({ variant: "destructive", title: "Error", description: "Could not delete post." })
    } finally {
      setIsDeleteDialogOpen(false)
      setPostToDelete(null)
    }
  }

  const handleSelectPost = (postId: string, isSelected: boolean) => {
    setSelectedPostIds((prev) => {
      const newSet = new Set(prev)
      if (isSelected) {
        newSet.add(postId)
      } else {
        newSet.delete(postId)
      }
      return newSet
    })
  }

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedPostIds(new Set(displayedPosts.map((p) => p.id)))
    } else {
      setSelectedPostIds(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPostIds.size === 0) return
    setIsBulkDeleting(true)
    try {
      console.log("Deleting posts:", Array.from(selectedPostIds))
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setPosts(posts.filter((p) => !selectedPostIds.has(p.id)))
      setSelectedPostIds(new Set())
      toast({ title: `${selectedPostIds.size} post(s) deleted` })
    } catch (error) {
      console.error("Failed to bulk delete posts:", error)
      toast({ variant: "destructive", title: "Error", description: "Could not delete selected posts." })
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const fetchPosts = async (sortBy?: string) => {
    setIsLoading(true)
    try {
      let url = `/api/boards/${board.id}/posts`;
      if (sortBy && sortBy !== 'all') {
        url += `?sortBy=${sortBy}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Failed to load posts. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'popular') {
      fetchPosts('popular');
    } else if (activeTab === 'newest') {
      fetchPosts('newest');
    } else {
      fetchPosts();
    }
  }, [activeTab, board.id]);

  const displayedPosts = useMemo(() => {
    return [...posts];
  }, [posts]);

  const navigateToSettings = () => {
    router.push(`/board/${board.id}/settings?userRole=${userRole}`)
  }

  const renderPostCard = (post: PostWithClientData) => (
    <Card key={post.id} className="mb-4 overflow-hidden relative">
      {canManageBoard && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={selectedPostIds.has(post.id)}
            onCheckedChange={(checked) => handleSelectPost(post.id, !!checked)}
            onClick={(e) => e.stopPropagation()}  // Prevent navigation when clicking checkbox
            aria-label={`Select post ${post.title}`}
            className="bg-background border-border"
          />
        </div>
      )}
      <CardContent className="p-0">
        <div className="flex">
          <div
            className={cn(
              "flex flex-col items-center justify-start bg-muted/50 p-2 space-y-1 w-12",
              canManageBoard && "pl-10"
            )}
          >
            <Button
              variant={post.userVote === 1 ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation()
                handleVote(post.id, 1)
              }}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{(post as any).votes || 0}</span>
            <Button
              variant={post.userVote === -1 ? "destructive" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation()
                handleVote(post.id, -1)
              }}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={(post.author as any).image || "/placeholder-user.jpg"}
                    alt={post.author.name || "User"}
                  />
                  <AvatarFallback>{post.author.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <span>{post.author.name || "Anonymous"}</span>
                <span>·</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                {post.githubIssue?.linked && (
                  <>
                    <span>·</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Github className="h-3 w-3" />
                    </Badge>
                  </>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {canDeletePost(post.authorId) && (
                    <DropdownMenuItem onClick={() => handleDeletePost(post)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <h3
              className="text-lg font-semibold mb-2 hover:underline cursor-pointer"
              onClick={() => router.push(`/board/${board.id}/post/${post.id}`)}
            >
              {post.title}
            </h3>
            {post.tags?.length ? (
              <div className="flex flex-wrap gap-1 mb-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            ) : null}
            {post.pollOptions && post.pollOptions.length > 0 && (
              <div className="space-y-2 p-4 poll-block">
                <Label>Poll</Label>
                <RadioGroup 
                  value={(pollSelections[post.id] ?? post.userPollVote)?.toString() || ''}
                  onValueChange={(v) => handlePollVote(post.id, Number(v))}
                >
                  {post.pollOptions.map((opt) => (
                    <div key={opt.id} className="flex items-center">
                      <RadioGroupItem 
                        value={opt.id.toString()} 
                        disabled={post.userPollVote != null} 
                        onClick={(e) => e.stopPropagation()} // Prevent card navigation
                      />
                      <span className="ml-2 flex-1">{opt.text}</span>
                      <span className="text-sm text-muted-foreground">{opt.votes}</span>
                    </div>
                  ))}
                </RadioGroup>
                {post.userPollVote == null && pollSelections[post.id] != null && (
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); handlePollSubmit(post.id); }}>
                    Submit Vote
                  </Button>
                )}
              </div>
            )}
            {post.content && !post.pollOptions && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{post.content}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 px-2">
                <MessageSquare className="h-4 w-4" />
                <span>{(post as any).comments || 0} Comments</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <main className="flex-1 container py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
            <Megaphone className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{board.name}</h1>
            <p className="text-muted-foreground">Welcome to the {board.name} board.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canCreatePost && (
            <Button onClick={() => setIsCreateDialogOpen(true)} disabled={isCreatingPost}>
              <Plus className="mr-2 h-4 w-4" /> New Post
            </Button>
          )}
          <PostCreationDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            boardId={board.id}
            userRole={userRole}
            onSubmit={async (data) => {
              setIsCreatingPost(true);
              try {
                const res = await fetch(`/api/boards/${board.id}/posts`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: data.title,
                    content: data.description,
                    tags: [], // adjust if tags supported
                    pollOptions: data.pollOptions,
                  }),
                });
                const created = await res.json();
                setPosts((ps) => [created, ...ps]);
              } catch (err) {
                console.error('Error creating post:', err);
              } finally {
                setIsCreatingPost(false);
              }
            }}
          />
          {canManageBoard && (
            <>
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" /> Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Members</DialogTitle>
                    <DialogDescription>Invite new members to collaborate on this board.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email Address</Label>
                      <Input id="invite-email" type="email" placeholder="member@example.com" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button>Send Invite</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="icon"
                onClick={navigateToSettings}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      {canManageBoard && selectedPostIds.size > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedPostIds.size}
          onClearSelection={() => setSelectedPostIds(new Set())}
          onDelete={handleBulkDelete}
          isDeleting={isBulkDeleting}
        />
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Posts</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="newest">Newest</TabsTrigger>
        </TabsList>
      </Tabs>
      <div>
        {displayedPosts.length > 0 ? (
          displayedPosts.map(renderPostCard)
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No posts yet.</p>
            {canCreatePost && <p>Be the first to create one!</p>}
          </div>
        )}
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post
              &quot;{postToDelete?.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePost}
              className={cn(
                buttonVariants({ variant: "destructive" }),
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
