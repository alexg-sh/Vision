"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Plus, User, Lock, Globe, Building2, Loader2, Users } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import type { BoardWithCounts, OrganizationWithBoardsAndCounts } from "./page"; // Import types from server component

interface DashboardClientProps {
  userId: string;
  personalBoards: BoardWithCounts[];
  organizations: OrganizationWithBoardsAndCounts[];
  joinedBoards: BoardWithCounts[]; // Assuming same structure for now
}

export default function DashboardClient({
  userId,
  personalBoards,
  organizations,
  joinedBoards,
}: DashboardClientProps) {
  const router = useRouter()
  const [isCreateBoardDialogOpen, setIsCreateBoardDialogOpen] = useState(false)
  const [isCreateOrgDialogOpen, setIsCreateOrgDialogOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [newBoardDescription, setNewBoardDescription] = useState("")
  const [newBoardImage, setNewBoardImage] = useState("/placeholder.svg?height=200&width=400")
  const [isPrivateBoard, setIsPrivateBoard] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [newOrgDescription, setNewOrgDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateBoard = async () => {
    if (newBoardName.trim()) {
      setIsLoading(true)
      setError(null)
      try {
        // API endpoint for creating a personal board (no organizationId)
        const response = await fetch(`/api/boards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newBoardName,
            description: newBoardDescription,
            image: newBoardImage,
            isPrivate: isPrivateBoard,
            // organizationId is omitted for personal boards
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create board');
        }

        // Reset form and close dialog
        setNewBoardName("")
        setNewBoardDescription("")
        setNewBoardImage("/placeholder.svg?height=200&width=400")
        setIsPrivateBoard(false)
        setIsCreateBoardDialogOpen(false)
        router.refresh(); // Refresh server component data

      } catch (err: any) {
        console.error("Error creating board:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleCreateOrganization = async () => {
    if (newOrgName.trim()) {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/organizations`, { // API endpoint for creating an organization
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newOrgName,
            description: newOrgDescription,
            // Add other fields like image, isPrivate if needed
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create organization');
        }

        // Reset form and close dialog
        setNewOrgName("")
        setNewOrgDescription("")
        setIsCreateOrgDialogOpen(false)
        router.refresh(); // Refresh server component data

      } catch (err: any) {
        console.error("Error creating organization:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          {/* Create Organization Dialog */}
          <Dialog open={isCreateOrgDialogOpen} onOpenChange={setIsCreateOrgDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isLoading}>
                <Building2 className="mr-2 h-4 w-4" />
                New Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new organization</DialogTitle>
                <DialogDescription>
                  Organizations group boards for teams or projects.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization name *</Label>
                  <Input
                    id="org-name"
                    placeholder="e.g., My Company"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-description">Description (optional)</Label>
                  <Textarea
                    id="org-description"
                    placeholder="Describe the purpose of this organization"
                    value={newOrgDescription}
                    onChange={(e) => setNewOrgDescription(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {/* Add fields for image, privacy etc. if needed */}
                {error && <p className="text-sm text-destructive">Error: {error}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsCreateOrgDialogOpen(false); setError(null); }} disabled={isLoading}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOrganization} disabled={isLoading || !newOrgName.trim()}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Creating..." : "Create Organization"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Personal Board Dialog */}
          <Dialog open={isCreateBoardDialogOpen} onOpenChange={setIsCreateBoardDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" />
                Create Personal Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new personal board</DialogTitle>
                <DialogDescription>
                  Personal boards aren't tied to an organization.
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

      <Tabs defaultValue="my-boards">
        <TabsList className="mb-6">
          <TabsTrigger value="my-boards">My Personal Boards</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="joined-boards">Joined Boards</TabsTrigger>
        </TabsList>

        {/* Personal Boards Tab */}
        <TabsContent value="my-boards" className="space-y-6">
          {personalBoards.length === 0 ? (
             <div className="rounded-lg border border-dashed p-8 text-center">
                <h3 className="text-lg font-medium mb-2">No personal boards yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Create a personal board for your own ideas or tasks.
                </p>
                <Button onClick={() => setIsCreateBoardDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Personal Board
                </Button>
              </div>
          ) : (
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
                    </div>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{board.name}</CardTitle>
                        {!board.isPrivate && (
                          <Badge variant="outline" className="gap-1">
                            <Globe className="h-3 w-3" />
                            Public
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{board.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{board._count?.posts ?? 0} posts</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{board._count?.members ?? 1} members</span> {/* Personal boards might just have 1 member */}
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
          )}
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-8">
          {organizations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No organizations yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Create or join an organization to collaborate with others.
              </p>
              <Button onClick={() => setIsCreateOrgDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Button>
            </div>
          ) : (
            organizations.map((org) => (
              <div key={org.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {org.name}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">{org.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{org._count?.members ?? 0} members</span>
                      </div>
                    <Link href={`/organization/${org.id}`}>
                      <Button variant="outline">Manage Organization</Button>
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {org.boards.map((board: BoardWithCounts) => (
                    <Link key={board.id} href={`/board/${board.id}`}>
                      <Card className="h-full hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors overflow-hidden">
                        <div className="relative h-40 w-full">
                          <Image
                            src={board.image || "/placeholder.svg"}
                            alt={board.name}
                            fill
                            className="object-cover"
                          />
                          {board.isPrivate && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="secondary" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Private
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>{board.name}</CardTitle>
                            {!board.isPrivate && (
                              <Badge variant="outline" className="gap-1">
                                <Globe className="h-3 w-3" />
                                Public
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{board.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{board._count?.posts ?? 0} posts</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{board._count?.members ?? 0} members</span>
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

                  {/* Link to create board within this organization */}
                  <Link href={`/organization/${org.id}/create-board`}>
                    <Card className="h-full border-dashed hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex flex-col items-center justify-center p-6">
                      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
                        <Plus className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Create Board</h3>
                      <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                        Add a new board to {org.name}
                      </p>
                    </Card>
                  </Link>
                </div>

                <Separator className="my-6" />
              </div>
            ))
          )}
        </TabsContent>

        {/* Joined Boards Tab */}
        <TabsContent value="joined-boards">
          {joinedBoards.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No joined boards yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Boards you join from other organizations will appear here.
              </p>
              {/* TODO: Link to discover page? */}
            </div>
          ) : (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* TODO: Render joined boards similar to personal boards */}
              {joinedBoards.map((board) => (
                 <Link key={board.id} href={`/board/${board.id}`}>
                   {/* ... Board Card component ... */}
                 </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
