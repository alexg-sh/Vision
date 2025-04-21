"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Ban,
  Clock,
  Edit,
  Github,
  Mail,
  MoreHorizontal,
  Save,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

// Define the Member type including status
interface Member {
  id: string
  name: string | null
  email: string | null
  avatar: string | null
  role: string
  status: string
}

export default function BoardSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const boardId = resolvedParams.id

  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "general"

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteUsername, setInviteUsername] = useState("")
  const [boardName, setBoardName] = useState("")
  const [boardDescription, setBoardDescription] = useState("")
  const [boardImage, setBoardImage] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [isGithubConnected, setIsGithubConnected] = useState(true)
  const [githubRepo, setGithubRepo] = useState("acme/project-vision")

  const [members, setMembers] = useState<Member[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true)
    setFetchError(null)
    try {
      const res = await fetch(`/api/boards/${boardId}/members`)
      if (res.status === 403) {
        // If user is not a board member, inform and navigate away
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to view this board's members.",
        })
        router.push('/dashboard')
        return
      }
      if (!res.ok) {
        let errorDetails = `Status: ${res.status}`
        let errorMessage = "Could not fetch the list of board members. Please try again later."
        try {
          const errorData = await res.json()
          errorDetails += `, Message: ${errorData.message || JSON.stringify(errorData)}`
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          try {
            const errorText = await res.text()
            errorDetails += `, Body: ${errorText}`
          } catch (textError) {}
        }
        console.error("Failed to load members:", errorDetails)
        setFetchError(errorMessage)
        toast({
          variant: "destructive",
          title: "Error Loading Members",
          description: errorMessage,
        })
      } else {
        const data = await res.json()
        setMembers(data)
      }
    } catch (err: any) {
      console.error("Error fetching members:", err)
      const errorMessage = err.message || "An unexpected error occurred while fetching members."
      setFetchError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error Loading Members",
        description: errorMessage,
      })
    } finally {
      setIsLoadingMembers(false)
    }
  }, [boardId, toast, router])

  useEffect(() => {
    fetchMembers()
  }, [boardId, fetchMembers])

  const [auditLogs, setAuditLogs] = useState([
    {
      id: 1,
      action: "created board",
      user: "John Doe",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      details: "Board 'Feature Requests' was created",
    },
    {
      id: 2,
      action: "invited user",
      user: "John Doe",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      details: "Invited 'Jane Smith' to the board",
    },
    {
      id: 3,
      action: "changed role",
      user: "John Doe",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      details: "Changed 'Jane Smith' role to 'moderator'",
    },
    {
      id: 4,
      action: "banned user",
      user: "Jane Smith",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      details: "Banned 'Alex Johnson' from the board",
    },
    {
      id: 5,
      action: "deleted post",
      user: "Jane Smith",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      details: "Deleted post 'Inappropriate content'",
    },
    {
      id: 6,
      action: "connected github",
      user: "John Doe",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      details: "Connected GitHub repository 'acme/project-vision'",
    },
    {
      id: 7,
      action: "linked issue",
      user: "John Doe",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      details: "Linked GitHub issue #42 to post 'Add dark mode support'",
    },
  ])

  // State for board settings loading and errors
  const [isLoadingBoard, setIsLoadingBoard] = useState(true)
  const [boardError, setBoardError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBoard() {
      setIsLoadingBoard(true)
      setBoardError(null)
      try {
        const res = await fetch(`/api/boards/${boardId}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          const message = err.message || 'Failed to load board'
          toast({ variant: 'destructive', title: 'Error Loading Board', description: message })
          setBoardError(message)
          return
        }
        const data = await res.json()
        setBoardName(data.name)
        setBoardDescription(data.description || "")
        setBoardImage(data.image || "")
        setIsPrivate(data.isPrivate)
      } catch (error: any) {
        const message = error.message || 'An unexpected error occurred while loading board'
        console.error('Error loading board:', error)
        toast({ variant: 'destructive', title: 'Error Loading Board', description: message })
        setBoardError(message)
      } finally {
        setIsLoadingBoard(false)
      }
    }
    loadBoard()
  }, [boardId, toast])

  const handleSaveSettings = async () => {
    setIsEditing(false)
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: boardName,
          description: boardDescription,
          image: boardImage,
          isPrivate,
        }),
      })
      if (!response.ok) throw new Error("Update failed")
      const updated = await response.json()
      setBoardName(updated.name)
      setBoardDescription(updated.description || "")
      setBoardImage(updated.image || "")
      setIsPrivate(updated.isPrivate)
      const newLog = {
        id: Date.now(),
        action: "updated settings",
        user: "John Doe",
        timestamp: new Date().toISOString(),
        details: "Updated board settings",
      }
      setAuditLogs([newLog, ...auditLogs])
    } catch (error) {
      console.error("Error saving settings:", error)
    }
  }

  const handleDeleteBoard = () => {
    router.push("/dashboard")
  }

  const handleInviteUser = async () => {
    if (inviteUsername.trim()) {
      try {
        const response = await fetch(`/api/invites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: inviteUsername,
            boardId: boardId,
          }),
        })

        const responseData = await response.json()

        if (!response.ok) {
          throw new Error(responseData.message || "Failed to send invite")
        }

        toast({
          title: "Invite Sent",
          description: responseData.message || `Invitation sent to ${inviteUsername}.`,
        })

        const newLog = {
          id: Date.now(),
          action: "invited user",
          user: "Current User",
          timestamp: new Date().toISOString(),
          details: `Invited '${inviteUsername}' to the board`,
        }
        setAuditLogs([newLog, ...auditLogs])

        setInviteUsername("")
        setIsInviteDialogOpen(false)
      } catch (error: any) {
        console.error("Error sending invite:", error)
        toast({
          variant: "destructive",
          title: "Invite Failed",
          description: error.message || "Could not send the invitation.",
        })
      }
    }
  }

  const handleChangeRole = (userId: string, newRole: string) => {
    setMembers(
      members.map((member) => {
        if (member.id === userId) {
          const newLog = {
            id: Date.now(),
            action: "changed role",
            user: "Current User",
            timestamp: new Date().toISOString(),
            details: `Changed '${member.name}' role to '${newRole}'`,
          }
          setAuditLogs([newLog, ...auditLogs])
          return { ...member, role: newRole }
        }
        return member
      }),
    )
    toast({ title: "Role Updated (Local)", description: "API call not yet implemented." })
  }

  const handleRemoveUser = (userId: string) => {
    const userToRemove = members.find((m) => m.id === userId)
    if (userToRemove) {
      setMembers(members.filter((member) => member.id !== userId))
      const newLog = {
        id: Date.now(),
        action: "removed user",
        user: "Current User",
        timestamp: new Date().toISOString(),
        details: `Removed '${userToRemove.name}' from the board`,
      }
      setAuditLogs([newLog, ...auditLogs])
      toast({ title: "User Removed (Local)", description: "API call not yet implemented." })
    }
  }

  const handleBanUser = async (userId: string, banReason: string | null = null) => {
    const userToBan = members.find((m) => m.id === userId)
    if (!userToBan) return

    try {
      const response = await fetch(`/api/boards/${boardId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "BANNED",
          banReason: banReason,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to ban user")
      }

      toast({
        title: "User Banned",
        description: `${userToBan.name || "User"} has been banned from the board.`,
      })

      setMembers(members.map((m) => (m.id === userId ? { ...m, status: "BANNED" } : m)))

      const newLog = {
        id: Date.now(),
        action: "banned user",
        user: "Current User",
        timestamp: new Date().toISOString(),
        details: `Banned '${userToBan.name}' from the board${banReason ? ` (Reason: ${banReason})` : ""}`,
      }
      setAuditLogs([newLog, ...auditLogs])
    } catch (error: any) {
      console.error("Error banning user:", error)
      toast({
        variant: "destructive",
        title: "Ban Failed",
        description: error.message || "Could not ban the user.",
      })
    }
  }

  const handleUnbanUser = async (userId: string) => {
    const userToUnban = members.find((m) => m.id === userId && m.status === "BANNED")
    if (!userToUnban) return

    try {
      const response = await fetch(`/api/boards/${boardId}/members/${userId}`, {
        method: "DELETE",
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to unban user")
      }

      toast({
        title: "User Unbanned",
        description: `${userToUnban.name || "User"} has been unbanned.`,
      })

      setMembers(members.map((m) => (m.id === userId ? { ...m, status: "ACTIVE" } : m)))

      const newLog = {
        id: Date.now(),
        action: "unbanned user",
        user: "Current User",
        timestamp: new Date().toISOString(),
        details: `Unbanned '${userToUnban.name}'`,
      }
      setAuditLogs([newLog, ...auditLogs])
    } catch (error: any) {
      console.error("Error unbanning user:", error)
      toast({
        variant: "destructive",
        title: "Unban Failed",
        description: error.message || "Could not unban the user.",
      })
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

  const activeMembers = members.filter((m) => m.status === "ACTIVE")
  const bannedMembers = members.filter((m) => m.status === "BANNED")

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/board/${boardId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Board Settings</h1>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members ({activeMembers.length})</TabsTrigger>
            <TabsTrigger value="banned">Banned ({bannedMembers.length})</TabsTrigger>
            <TabsTrigger value="github">GitHub</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Manage your board's basic information and privacy settings.</CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="board-name">Board name</Label>
                  <Input
                    id="board-name"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="board-description">Description</Label>
                  <Textarea
                    id="board-description"
                    value={boardDescription}
                    onChange={(e) => setBoardDescription(e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="board-image">Board image URL</Label>
                  <Input
                    id="board-image"
                    value={boardImage}
                    onChange={(e) => setBoardImage(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="private-mode" checked={isPrivate} onCheckedChange={setIsPrivate} disabled={!isEditing} />
                  <Label htmlFor="private-mode">Private board</Label>
                </div>
                {isPrivate && (
                  <p className="text-sm text-muted-foreground">Private boards are only visible to invited members.</p>
                )}
                {isEditing && (
                  <div className="pt-4">
                    <Button onClick={handleSaveSettings}>Save Changes</Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t pt-6 flex flex-col items-start">
                <h3 className="text-lg font-medium mb-2">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete a board, there is no going back. Please be certain.
                </p>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Board
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the board and all its content.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteBoard}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Active Board Members</CardTitle>
                    <CardDescription>Manage active members and their roles within this board.</CardDescription>
                  </div>
                  <AlertDialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite User
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Invite a new member</AlertDialogTitle>
                        <AlertDialogDescription>
                          Enter the username of the person you want to invite to this board.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Label htmlFor="invite-username" className="mb-2 block">
                          Username
                        </Label>
                        <Input
                          id="invite-username"
                          placeholder="username"
                          type="text"
                          value={inviteUsername}
                          onChange={(e) => setInviteUsername(e.target.value)}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleInviteUser}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Invitation
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingMembers ? (
                  <p>Loading members...</p>
                ) : fetchError ? (
                  <p className="text-destructive">Error: {fetchError}</p>
                ) : activeMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No active members found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name ?? "User"} />
                            <AvatarFallback>{member.name?.charAt(0) ?? "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.name}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              member.role === "ADMIN" ? "default" : member.role === "MODERATOR" ? "secondary" : "outline"
                            }
                            className="capitalize"
                          >
                            {member.role === "ADMIN" && <Shield className="mr-1 h-3 w-3" />}
                            {member.role.toLowerCase()}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => handleChangeRole(member.id, "ADMIN")}
                                disabled={member.role === "ADMIN"}
                              >
                                Make Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleChangeRole(member.id, "MODERATOR")}
                                disabled={member.role === "MODERATOR"}
                              >
                                Make Moderator
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleChangeRole(member.id, "MEMBER")}
                                disabled={member.role === "MEMBER"}
                              >
                                Make Member
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleRemoveUser(member.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Remove from Board
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleBanUser(member.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Ban User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banned">
            <Card>
              <CardHeader>
                <CardTitle>Banned Users</CardTitle>
                <CardDescription>Users who are currently banned from this board.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMembers ? (
                  <p>Loading members...</p>
                ) : fetchError ? (
                  <p className="text-destructive">Error: {fetchError}</p>
                ) : bannedMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No banned users found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bannedMembers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 opacity-70">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name ?? "User"} />
                            <AvatarFallback>{user.name?.charAt(0) ?? "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleUnbanUser(user.id)}>
                          Unban
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="github">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    <div>
                      <CardTitle>GitHub Integration</CardTitle>
                      <CardDescription>Connect your board to a GitHub repository to sync issues.</CardDescription>
                    </div>
                  </div>
                  {isGithubConnected ? (
                    <Badge
                      variant="outline"
                      className="gap-1 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800"
                    >
                      Connected
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1 bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                    >
                      Disconnected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isGithubConnected ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Github className="h-5 w-5" />
                        <span className="font-medium">{githubRepo}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/board/${boardId}/settings/github`)}
                      >
                        Manage Integration
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 border rounded-lg">
                        <h3 className="text-lg font-medium mb-2">Synced Issues</h3>
                        <p className="text-muted-foreground mb-4">GitHub issues that are synced with this board.</p>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold">12</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/board/${boardId}?tab=github`)}
                          >
                            View Issues
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h3 className="text-lg font-medium mb-2">Linked Posts</h3>
                        <p className="text-muted-foreground mb-4">Feedback posts that are linked to GitHub issues.</p>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold">8</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/board/${boardId}/settings/github`)}
                          >
                            Manage Links
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button variant="outline" onClick={() => router.push(`/board/${boardId}/settings/github`)}>
                        Advanced GitHub Settings
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Github className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Connect to GitHub</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Connect your board to a GitHub repository to sync issues and streamline your workflow.
                    </p>
                    <Button onClick={() => router.push(`/board/${boardId}/settings/github`)}>
                      <Github className="mr-2 h-4 w-4" />
                      Connect GitHub Repository
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>Track all actions performed on this board.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        <div className="rounded-full bg-muted p-2">
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
