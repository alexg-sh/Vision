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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MessageSquare,
  Plus,
  User,
  Lock,
  Globe,
  Building2,
  Users,
  Settings,
  UserPlus,
  Clock,
  History,
  LogOut,
} from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"

export default function OrganizationPage({ params }: { params: { id: string } }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [newBoardDescription, setNewBoardDescription] = useState("")
  const [newBoardImage, setNewBoardImage] = useState("/placeholder.svg?height=200&width=400")
  const [isPrivate, setIsPrivate] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")

  // Mock organization data
  const [organization, setOrganization] = useState({
    id: Number.parseInt(params.id),
    name: "Acme Corp",
    description: "Company-wide feedback boards",
    image: "/placeholder.svg?height=400&width=400",
    isPrivate: false,
    members: 15,
    userRole: "member", // admin, moderator, member
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
      {
        id: 5,
        name: "Bug Reports",
        description: "Track and manage bug reports from users",
        image: "/placeholder.svg?height=200&width=400",
        posts: 32,
        members: 10,
        isPrivate: false,
      },
    ],
  })

  // Mock recent audit logs
  const recentAuditLogs = [
    {
      id: 1,
      action: "created board",
      user: "John Doe",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      details: "Board 'Feature Requests' was created",
    },
    {
      id: 2,
      action: "invited user",
      user: "John Doe",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      details: "Invited 'Jane Smith' to the organization",
    },
    {
      id: 3,
      action: "changed role",
      user: "John Doe",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
      details: "Changed 'Jane Smith' role to 'moderator'",
    },
  ]

  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      const newBoard = {
        id: Math.max(...organization.boards.map((b) => b.id)) + 1,
        name: newBoardName,
        description: newBoardDescription || "No description provided",
        image: newBoardImage,
        posts: 0,
        members: 1,
        isPrivate: isPrivate,
      }
      setOrganization({
        ...organization,
        boards: [...organization.boards, newBoard],
      })
      setNewBoardName("")
      setNewBoardDescription("")
      setNewBoardImage("/placeholder.svg?height=200&width=400")
      setIsPrivate(false)
      setIsDialogOpen(false)
    }
  }

  const handleInviteUser = () => {
    if (inviteEmail.trim()) {
      // In a real app, this would send an invitation to the user
      alert(`Invitation sent to ${inviteEmail} to join the organization`)
      setInviteEmail("")
      setIsInviteDialogOpen(false)
    }
  }

  const handleLeaveOrganization = () => {
    // In a real app, this would call an API to remove the user from the organization
    // For demo purposes, we'll just redirect to the dashboard
    window.location.href = "/dashboard"
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

  const isAdmin = organization.userRole === "admin"
  const isModerator = organization.userRole === "moderator" || isAdmin

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-lg overflow-hidden">
              <Image
                src={organization.image || "/placeholder.svg"}
                alt={organization.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <h1 className="text-3xl font-bold">{organization.name}</h1>
                {organization.isPrivate ? (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Private
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <Globe className="h-3 w-3" />
                    Public
                  </Badge>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{organization.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isModerator && (
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Members
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite members to this organization</DialogTitle>
                    <DialogDescription>
                      Send invitations to people you want to collaborate with in this organization.
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
                        <Button onClick={handleInviteUser}>Invite</Button>
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

            {isModerator && (
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
                      <p className="text-sm text-muted-foreground">
                        Private boards are only visible to invited members.
                      </p>
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
            )}

            {isAdmin && (
              <Button variant="outline" onClick={() => (window.location.href = `/organization/${params.id}/settings`)}>
                <Settings className="mr-2 h-4 w-4" />
                Organization Settings
              </Button>
            )}

            {!isAdmin && (
              <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Organization
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Leave Organization</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to leave this organization? You will lose access to all boards and content.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setIsLeaveDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleLeaveOrganization}>
                      Leave Organization
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{organization.members} members</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{organization.boards.length} boards</span>
          </div>
          <div className="ml-auto">
            <Link href={`/organization/${params.id}/audit-log`}>
              <Button variant="outline" size="sm" className="gap-1">
                <History className="h-4 w-4" />
                View Audit Log
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="boards">
          <TabsList className="mb-6">
            <TabsTrigger value="boards">Boards</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="boards" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {organization.boards.map((board) => (
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

              {isModerator && (
                <Card className="h-full border-dashed hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex flex-col items-center justify-center p-6">
                  <Button
                    variant="ghost"
                    className="h-full w-full flex flex-col gap-4"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
                      <Plus className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-medium mb-2">Create Board</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Add a new board to this organization</p>
                    </div>
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Organization Members</CardTitle>
                    <CardDescription>Manage members and their roles within the organization.</CardDescription>
                  </div>
                  {isModerator && (
                    <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Members
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: "John Doe",
                      email: "john@example.com",
                      role: "Owner",
                      avatar: "/placeholder.svg?height=40&width=40",
                    },
                    {
                      name: "Jane Smith",
                      email: "jane@example.com",
                      role: "Admin",
                      avatar: "/placeholder.svg?height=40&width=40",
                    },
                    {
                      name: "Mike Johnson",
                      email: "mike@example.com",
                      role: "Member",
                      avatar: "/placeholder.svg?height=40&width=40",
                    },
                  ].map((member, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          member.role === "Owner" ? "default" : member.role === "Admin" ? "secondary" : "outline"
                        }
                      >
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/organization/${params.id}/members`}>
                  <Button variant="outline">View All Members</Button>
                </Link>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Recent actions and changes across all boards in this organization.
                    </CardDescription>
                  </div>
                  <Link href={`/organization/${params.id}/audit-log`}>
                    <Button variant="outline" size="sm">
                      <History className="mr-2 h-4 w-4" />
                      View Full Audit Log
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAuditLogs.map((log) => (
                    <div key={log.id} className="flex gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-2">
                          <Clock className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <div>
                            <span className="font-medium">{log.user}</span>{" "}
                            <span className="text-muted-foreground">{log.action}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{formatDate(log.timestamp)}</span>
                        </div>
                        <p className="text-sm mt-1">{log.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
