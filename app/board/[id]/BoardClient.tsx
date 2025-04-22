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
import { Separator } from "@/components/ui/separator"; // Correct import for Separator
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
import DashboardHeader from "@/components/dashboard-header"
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
// Import the types defined in page.tsx
import type { PostWithClientData, ClientBoardData, PollOption } from './page';

// --- Component Props ---

interface BoardClientProps {
  board: ClientBoardData; // Use the simplified, serializable board type
  initialPosts: PostWithClientData[];
  userRole: 'guest' | 'member' | 'moderator' | 'admin' | 'creator';
}

// --- Helper Functions (if any) ---

// Placeholder for getting current user ID (replace with actual implementation)
const getCurrentUserId = (): string | null => {
  // Example using useSession hook (if available in this component's context)
  // const { data: session } = useSession();
  // return session?.user?.id || null;
  return "temp_user_id"; // Placeholder
};


export default function BoardClient({ board, initialPosts, userRole }: BoardClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [posts, setPosts] = useState<PostWithClientData[]>(initialPosts)
  const [selectedPost, setSelectedPost] = useState<PostWithClientData | null>(null)
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all") // 'all', 'popular', 'newest'
  const currentUserId = getCurrentUserId(); // Get current user ID
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // --- Permissions ---
  const canCreatePost = true; // All users can post
  const canManageBoard = userRole === 'admin' || userRole === 'moderator' || userRole === 'creator'; // Owner/controller also has full perms
  const canDeletePost = (postAuthorId: string) => userRole === 'admin' || userRole === 'moderator' || (currentUserId !== null && postAuthorId === currentUserId);


  // --- Event Handlers ---
  const handleVote = (postId: string, voteType: 1 | -1) => {
    setPosts(
      posts.map((p) => {
        if (p.id === postId) {
          const currentVote = p.userVote || 0;
          // Toggle logic: If clicking the same vote type, reset to 0. Otherwise, set to new vote type.
          const newUserVote = currentVote === voteType ? 0 : voteType;
          return { ...p, userVote: newUserVote };
        }
        return p;
      })
    );
    // TODO: API call to update vote count
  };

  const handlePollVote = (postId: string, optionId: number) => {
    setPosts(
      posts.map((p) => {
        if (p.id === postId) {
          // Allow changing vote, but not deselecting for now
          return { ...p, userPollVote: optionId };
        }
        return p;
      })
    );
    // TODO: API call to update poll vote
  };

  const handleOpenPostDialog = (post: PostWithClientData) => {
    setSelectedPost(post)
    setIsPostDialogOpen(true)
  }

  const handleDeletePost = (post: PostWithClientData) => {
    setSelectedPost(post)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeletePost = () => {
    if (!selectedPost) return;
    // TODO: API call to delete post
    setPosts(posts.filter((p) => p.id !== selectedPost.id))
    setIsDeleteDialogOpen(false)
    setSelectedPost(null)
  }

  const handleCreatePost = () => {
    // TODO: Implement post creation logic (likely open a dialog/modal)
    console.log("Create post clicked");
  };

  // Event handler for submitting a new post
  const submitNewPost = async () => {
    if (!newPostTitle.trim()) {
      setCreateError('Title is required');
      return;
    }
    setIsCreatingPost(true);
    setCreateError(null);
    try {
      const res = await fetch(`/api/boards/${board.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newPostTitle, content: newPostContent })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to create post');
      }
      const created = await res.json();
      setPosts([created, ...posts]);
      setIsCreateDialogOpen(false);
      setNewPostTitle('');
      setNewPostContent('');
      toast({ title: 'Post created' });
    } catch (err: any) {
      setCreateError(err.message || 'Unexpected error');
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsCreatingPost(false);
    }
  }

  // --- Rendering Logic ---
  const renderPostCard = (post: PostWithClientData) => (
    <Card key={post.id} className="mb-4 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          {/* Vote Section */}
          <div className="flex flex-col items-center justify-start bg-muted/50 p-2 space-y-1 w-12">
            <Button
              variant={post.userVote === 1 ? "default" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleVote(post.id, 1)}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {/* Placeholder for vote count */}
              { (post as any).votes || 0 }
            </span>
            <Button
              variant={post.userVote === -1 ? "destructive" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleVote(post.id, -1)}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={(post.author as any).image || "/placeholder-user.jpg"} alt={post.author.name || "User"} />
                  <AvatarFallback>{post.author.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span>{post.author.name || "Anonymous"}</span>
                <span>·</span>
                {/* Placeholder for time ago */}
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                {post.githubIssue?.linked && (
                  <>
                    <span>·</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Github className="h-3 w-3" />
                      #{post.githubIssue.number}
                    </Badge>
                  </>
                )}
              </div>
              {/* Post Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Add actions like Edit, Hide, Report */}
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
              className="text-lg font-semibold mb-2 cursor-pointer hover:underline"
              onClick={() => handleOpenPostDialog(post)}
            >
              {post.title}
            </h3>

            {/* Render different content based on post type */}
            {/* Example: Poll */}
            {post.pollOptions && post.pollOptions.length > 0 && (
              <RadioGroup
                value={post.userPollVote?.toString()}
                onValueChange={(value) => handlePollVote(post.id, parseInt(value))}
                className="space-y-2 mb-4"
              >
                {post.pollOptions.map((option: PollOption) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id.toString()} id={`poll-${post.id}-opt-${option.id}`} />
                    <Label htmlFor={`poll-${post.id}-opt-${option.id}`} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                    {/* Optionally show vote counts */}
                    <span className="text-sm text-muted-foreground">({option.votes} votes)</span>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Example: Image/Content Snippet */}
            {post.content && !post.pollOptions && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {post.content}
              </p>
            )}

            {/* Footer Actions */}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <Button variant="ghost" size="sm" className="flex items-center gap-1 px-2" onClick={() => handleOpenPostDialog(post)}>
                <MessageSquare className="h-4 w-4" />
                {/* Placeholder for comment count */}
                <span>{ (post as any).comments || 0 } Comments</span>
              </Button>
              {/* Add Share, Save buttons etc. */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Filter/Sort posts based on activeTab
  const displayedPosts = posts // Add filtering/sorting logic here based on activeTab

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        {/* Board Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* Placeholder for board image */}
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              {/* Icon based on board type? */}
              <Megaphone className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{board.name}</h1>
              <p className="text-muted-foreground">
                {/* Placeholder for board description */}
                Welcome to the {board.name} board.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canCreatePost && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" /> Create Post</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Post</DialogTitle>
                    <DialogDescription>Use markdown to format content, include image URLs.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-post-title">Title *</Label>
                      <Input id="new-post-title" value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} disabled={isCreatingPost} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-post-content">Content (Markdown)</Label>
                      <Textarea id="new-post-content" value={newPostContent} onChange={e => setNewPostContent(e.target.value)} disabled={isCreatingPost} rows={6} />
                    </div>
                    {newPostContent && (
                      <div className="border p-4 rounded-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{newPostContent}</ReactMarkdown>
                      </div>
                    )}
                    {createError && <p className="text-sm text-destructive">Error: {createError}</p>}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreatingPost}>Cancel</Button>
                    <Button onClick={submitNewPost} disabled={isCreatingPost}>
                      {isCreatingPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isCreatingPost ? 'Posting...' : 'Post'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {canManageBoard && (
              <>
                {/* Invite dialog stays unchanged */}
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <UserPlus className="mr-2 h-4 w-4" /> Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Members</DialogTitle>
                      <DialogDescription>
                        Invite new members to collaborate on this board.
                      </DialogDescription>
                    </DialogHeader>
                    {/* Invite Form */}
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email Address</Label>
                        <Input id="invite-email" type="email" placeholder="member@example.com" />
                      </div>
                      {/* Add role selection if applicable */}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
                      <Button>Send Invite</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* Link to dedicated settings page */}
                <Button variant="outline" size="icon" onClick={() => router.push(`/board/${board.id}/settings`)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs for Filtering/Sorting */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Posts</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="newest">Newest</TabsTrigger>
            {/* Add more tabs like 'Bugs', 'Features' if using categories */}
          </TabsList>
        </Tabs>

        {/* Posts List */}
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

        {/* Post Detail Dialog */}
        <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            {selectedPost && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedPost.title}</DialogTitle>
                  <DialogDescription>
                    Posted by {selectedPost.author.name || "Anonymous"} {/* Time ago */}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Full Post Content */}
                  <p>{selectedPost.content}</p>

                  {/* Poll (if applicable) */}
                  {selectedPost.pollOptions && selectedPost.pollOptions.length > 0 && (
                    <RadioGroup
                      value={selectedPost.userPollVote?.toString()}
                      onValueChange={(value) => handlePollVote(selectedPost.id, parseInt(value))}
                      className="space-y-2 mb-4"
                    >
                      {selectedPost.pollOptions.map((option: PollOption) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.id.toString()} id={`dialog-poll-${selectedPost.id}-opt-${option.id}`} />
                          <Label htmlFor={`dialog-poll-${selectedPost.id}-opt-${option.id}`} className="flex-1 cursor-pointer">
                            {option.text}
                          </Label>
                          <span className="text-sm text-muted-foreground">({option.votes} votes)</span>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {/* GitHub Link (if applicable) */}
                  {selectedPost.githubIssue?.linked && (
                    <div className="flex items-center space-x-2">
                      <Github className="h-4 w-4" />
                      <Link href={`https://github.com/your-repo/issues/${selectedPost.githubIssue.number}`} target="_blank" className="text-sm hover:underline">
                        View on GitHub #{selectedPost.githubIssue.number}
                      </Link>
                      <Badge variant="secondary">{selectedPost.githubIssue.status}</Badge>
                    </div>
                  )}

                  <Separator />

                  {/* Comments Section Placeholder */}
                  <h4 className="font-semibold">Comments</h4>
                  <div className="text-sm text-muted-foreground">
                    Comments section coming soon...
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPostDialogOpen(false)}>Close</Button>
                  {/* Add comment input/button */}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the post
                &quot;{selectedPost?.title}&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
