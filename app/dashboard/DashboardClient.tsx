"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, MessageSquare, Globe, Lock } from "lucide-react"
import { toast } from "@/hooks/use-toast"

type BoardWithCounts = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  isPrivate: boolean;
  _count?: {
    posts?: number;
  } | null;
};

interface DashboardClientProps {
  userId: string;
  personalBoards: BoardWithCounts[];
  memberBoards: BoardWithCounts[];
  organizations: { id: string; name: string; slug: string; imageUrl: string | null }[];
}

export default function DashboardClient({
  userId,
  personalBoards,
  memberBoards,
  organizations,
}: DashboardClientProps) {
  const router = useRouter()
  const [isCreateBoardDialogOpen, setIsCreateBoardDialogOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [newBoardDescription, setNewBoardDescription] = useState("")
  const [newBoardImage, setNewBoardImage] = useState("/placeholder.svg?height=200&width=400")
  const [isPrivateBoard, setIsPrivateBoard] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateBoard = async () => {
    if (newBoardName.trim()) {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/boards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newBoardName,
            description: newBoardDescription,
            image: newBoardImage,
            isPrivate: isPrivateBoard,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const message = errorData.message || 'Failed to create board';
          toast({ variant: 'destructive', title: 'Create Failed', description: message });
          setError(message);
          setIsLoading(false);
          return;
        }

        setNewBoardName("")
        setNewBoardDescription("")
        setNewBoardImage("/placeholder.svg?height=200&width=400")
        setIsPrivateBoard(false)
        setIsCreateBoardDialogOpen(false)
        router.refresh();
      } catch (err: any) {
        console.error("Error creating board:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateBoardDialogOpen} onOpenChange={setIsCreateBoardDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" />
                Create Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new board</DialogTitle>
                <DialogDescription>
                  Create a personal board for your own ideas or tasks.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="board-name">Board name *</Label>
                  <Input
                    id="board-name"
                    placeholder="e.g., My Ideas"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="board-description">Description (optional)</Label>
                  <Textarea
                    id="board-description"
                    placeholder="Describe the purpose of this board"
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="board-image">Board image URL (optional)</Label>
                  <Input
                    id="board-image"
                    placeholder="https://example.com/image.jpg"
                    value={newBoardImage}
                    onChange={(e) => setNewBoardImage(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="private-mode" checked={isPrivateBoard} onCheckedChange={setIsPrivateBoard} disabled={isLoading} />
                  <Label htmlFor="private-mode">Private board</Label>
                </div>
                {isPrivateBoard && (
                  <p className="text-sm text-muted-foreground">Private boards are only visible to you.</p>
                )}
                {error && <p className="text-sm text-destructive">Error: {error}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsCreateBoardDialogOpen(false); setError(null); }} disabled={isLoading}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBoard} disabled={isLoading || !newBoardName.trim()}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Creating..." : "Create Board"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">My Boards</h2>
        {personalBoards.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {personalBoards.map((board) => (
              <Link key={board.id} href={`/board/${board.id}`}>
                <Card className="h-full hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors overflow-hidden">
                  <div className="relative h-40 w-full">
                    <Image src={board.image || "/placeholder.svg"} alt={board.name} fill className="object-cover" />
                    {board.isPrivate && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Private
                        </Badge>
                      </div>
                    )}
                    {!board.isPrivate && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="gap-1">
                          <Globe className="h-3 w-3" />
                          Public
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle>{board.name}</CardTitle>
                    <CardDescription>{board.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{board._count?.posts ?? 0} posts</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      View Board
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No boards owned. Join or create one!</p>
          </div>
        )}
        {memberBoards.length > 0 && (
          <>
            <h3 className="text-xl font-semibold mt-10 mb-4">Boards I'm a Member Of</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {memberBoards.map((board) => (
                <Link key={board.id} href={`/board/${board.id}`}>
                  <Card className="h-full hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors overflow-hidden">
                    <div className="relative h-40 w-full">
                      <Image src={board.image || "/placeholder.svg"} alt={board.name} fill className="object-cover" />
                      {board.isPrivate && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Private
                          </Badge>
                        </div>
                      )}
                      {!board.isPrivate && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="gap-1">
                            <Globe className="h-3 w-3" />
                            Public
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle>{board.name}</CardTitle>
                      <CardDescription>{board.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{board._count?.posts ?? 0} posts</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" className="w-full">
                        View Board
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">My Organizations</h2>
        {organizations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <Link key={org.id} href={`/organization/${org.slug}`}>
                <Card className="h-full hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors overflow-hidden">
                  <div className="relative h-40 w-full">
                    <Image src={org.imageUrl || "/placeholder.svg"} alt={org.name} fill className="object-cover" />
                  </div>
                  <CardHeader>
                    <CardTitle>{org.name}</CardTitle>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      View Organization
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>You are not part of any organization.</p>
          </div>
        )}
      </section>
    </>
  )
}
