"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
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
import { MessageSquare, Plus, User, Lock, Globe, Building2 } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
import { Separator } from "@/components/ui/separator"

export default function DashboardPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [newBoardDescription, setNewBoardDescription] = useState("")
  const [newBoardImage, setNewBoardImage] = useState("/placeholder.svg?height=200&width=400")
  const [isPrivate, setIsPrivate] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [newOrgDescription, setNewOrgDescription] = useState("")

  const [boards, setBoards] = useState([
    {
      id: 1,
      name: "Feature Requests",
      description: "Collect and prioritize feature ideas from users",
      image: "/placeholder.svg?height=200&width=400",
      posts: 12,
      members: 5,
      isPrivate: false,
    },
    {
      id: 2,
      name: "Bug Reports",
      description: "Track and manage bug reports from users",
      image: "/placeholder.svg?height=200&width=400",
      posts: 8,
      members: 3,
      isPrivate: true,
    },
  ])

  const [organizations, setOrganizations] = useState([
    {
      id: 1,
      name: "Acme Corp",
      description: "Company-wide feedback boards",
      boards: [
        {
          id: 3,
          name: "Product Roadmap",
          description: "Long-term product planning and roadmap",
          image: "/placeholder.svg?height=200&width=400",
          posts: 24,
          members: 12,
          isPrivate: true,
        },
        {
          id: 4,
          name: "Design Feedback",
          description: "Feedback on UI/UX designs",
          image: "/placeholder.svg?height=200&width=400",
          posts: 18,
          members: 8,
          isPrivate: false,
        },
      ],
    },
  ])

  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      const newBoard = {
        id: boards.length + 1,
        name: newBoardName,
        description: newBoardDescription || "No description provided",
        image: newBoardImage,
        posts: 0,
        members: 1,
        isPrivate: isPrivate,
      }
      setBoards([...boards, newBoard])
      setNewBoardName("")
      setNewBoardDescription("")
      setNewBoardImage("/placeholder.svg?height=200&width=400")
      setIsPrivate(false)
      setIsDialogOpen(false)
    }
  }

  const handleCreateOrganization = () => {
    if (newOrgName.trim()) {
      const newOrg = {
        id: organizations.length + 1,
        name: newOrgName,
        description: newOrgDescription || "No description provided",
        boards: [],
      }
      setOrganizations([...organizations, newOrg])
      setNewOrgName("")
      setNewOrgDescription("")
      setIsOrgDialogOpen(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Building2 className="mr-2 h-4 w-4" />
                  New Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a new organization</DialogTitle>
                  <DialogDescription>
                    Organizations can contain multiple boards for team collaboration.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Organization name</Label>
                    <Input
                      id="org-name"
                      placeholder="e.g., My Company"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-description">Description (optional)</Label>
                    <Textarea
                      id="org-description"
                      placeholder="Describe the purpose of this organization"
                      value={newOrgDescription}
                      onChange={(e) => setNewOrgDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOrgDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOrganization}>Create Organization</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Board
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a new board</DialogTitle>
                  <DialogDescription>Give your board a name, description, and privacy setting.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="board-name">Board name</Label>
                    <Input
                      id="board-name"
                      placeholder="e.g., Feature Requests"
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="board-description">Description (optional)</Label>
                    <Textarea
                      id="board-description"
                      placeholder="Describe the purpose of this board"
                      value={newBoardDescription}
                      onChange={(e) => setNewBoardDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="board-image">Board image URL (optional)</Label>
                    <Input
                      id="board-image"
                      placeholder="https://example.com/image.jpg"
                      value={newBoardImage}
                      onChange={(e) => setNewBoardImage(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="private-mode" checked={isPrivate} onCheckedChange={setIsPrivate} />
                    <Label htmlFor="private-mode">Private board</Label>
                  </div>
                  {isPrivate && (
                    <p className="text-sm text-muted-foreground">Private boards are only visible to invited members.</p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBoard}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="my-boards">
          <TabsList className="mb-6">
            <TabsTrigger value="my-boards">My Boards</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="joined-boards">Joined Boards</TabsTrigger>
          </TabsList>

          <TabsContent value="my-boards" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {boards.map((board) => (
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
                          <span>{board.posts} posts</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{board.members} members</span>
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
          </TabsContent>

          <TabsContent value="organizations" className="space-y-8">
            {organizations.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <h3 className="text-lg font-medium mb-2">No organizations yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Create an organization to group related boards together.
                </p>
                <Button onClick={() => setIsOrgDialogOpen(true)}>
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
                    <Link href={`/organization/${org.id}`}>
                      <Button variant="outline">Manage Organization</Button>
                    </Link>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {org.boards.map((board) => (
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
                                <span>{board.posts} posts</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{board.members} members</span>
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

                    <Link href={`/organization/${org.id}/create-board`}>
                      <Card className="h-full border-dashed hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex flex-col items-center justify-center p-6">
                        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
                          <Plus className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Create Board</h3>
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                          Add a new board to this organization
                        </p>
                      </Card>
                    </Link>
                  </div>

                  <Separator className="my-6" />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="joined-boards">
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No joined boards yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                You haven&apos;t joined any boards created by others.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">When you join a board, it will appear here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
