"use client"

import { useState, useEffect } from "react"
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

export default function BoardSettingsPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "general"

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [boardName, setBoardName] = useState("")
  const [boardDescription, setBoardDescription] = useState("")
  const [boardImage, setBoardImage] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [bannedUsers, setBannedUsers] = useState([
    { id: 3, name: "Alex Johnson", email: "alex@example.com", avatar: "/placeholder.svg?height=40&width=40" },
  ])

  // GitHub integration state
  const [isGithubConnected, setIsGithubConnected] = useState(true)
  const [githubRepo, setGithubRepo] = useState("acme/project-vision")

  // Fetch real members from API
  const [members, setMembers] = useState<{ id: string; name: string; email: string; avatar: string | null; role: string }[]>([])

  useEffect(() => {
    fetch(`/api/boards/${params.id}/members`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load members")
        return res.json()
      })
      .then((data) => setMembers(data))
      .catch((err) => console.error(err))
  }, [params.id])

  // Mock audit logs
  const [auditLogs, setAuditLogs] = useState([
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
      details: "Invited 'Jane Smith' to the board",
    },
    {
      id: 3,
      action: "changed role",
      user: "John Doe",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
      details: "Changed 'Jane Smith' role to 'moderator'",
    },
    {
      id: 4,
      action: "banned user",
      user: "Jane Smith",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      details: "Banned 'Alex Johnson' from the board",
    },
    {
      id: 5,
      action: "deleted post",
      user: "Jane Smith",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      details: "Deleted post 'Inappropriate content'",
    },
    {
      id: 6,
      action: "connected github",
      user: "John Doe",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
      details: "Connected GitHub repository 'acme/project-vision'",
    },
    {
      id: 7,
      action: "linked issue",
      user: "John Doe",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      details: "Linked GitHub issue #42 to post 'Add dark mode support'",
    },
  ])

  // Fetch real board settings on component mount
  useEffect(() => {
    fetch(`/api/boards/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load board")
        return res.json()
      })
      .then((data) => {
        setBoardName(data.name)
        setBoardDescription(data.description || "")
        setBoardImage(data.image || "")
        setIsPrivate(data.isPrivate)
      })
      .catch((err) => console.error(err))
  }, [params.id])

  const handleSaveSettings = async () => {
    setIsEditing(false)
    try {
      const response = await fetch(`/api/boards/${params.id}`, {
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
      // Update state with returned values
      setBoardName(updated.name)
      setBoardDescription(updated.description || "")
      setBoardImage(updated.image || "")
      setIsPrivate(updated.isPrivate)
      // Log audit entry
      const newLog = {
        id: Date.now(),
        action: "updated settings",
        user: "John Doe", // assume fetched or available
        timestamp: new Date().toISOString(),
        details: "Updated board settings",
      }
      setAuditLogs([newLog, ...auditLogs])
    } catch (error) {
      console.error("Error saving settings:", error)
    }
  }

  const handleDeleteBoard = () => {
    // In a real app, this would delete the board
    router.push("/dashboard")
  }

  const handleInviteUser = () => {
    if (inviteEmail.trim()) {
      // In a real app, this would send an invitation to the user
      // Add to audit log
      const newLog = {
        id: auditLogs.length + 1,
        action: "invited user",
        user: "John Doe",
        timestamp: new Date().toISOString(),
        details: `Invited '${inviteEmail}' to the board`,
      }
      setAuditLogs([newLog, ...auditLogs])
      setInviteEmail("")
      setIsInviteDialogOpen(false)
    }
  }

  const handleChangeRole = (userId: number, newRole: string) => {
    setMembers(
      members.map((member) => {
        if (member.id === userId) {
          // Add to audit log
          const newLog = {
            id: auditLogs.length + 1,
            action: "changed role",
            user: "John Doe",
            timestamp: new Date().toISOString(),
            details: `Changed '${member.name}' role to '${newRole}'`,
          }
          setAuditLogs([newLog, ...auditLogs])
          return { ...member, role: newRole }
        }
        return member
      }),
    )
  }

  const handleRemoveUser = (userId: number) => {
    const userToRemove = members.find((m) => m.id === userId)
    if (userToRemove) {
      setMembers(members.filter((member) => member.id !== userId))
      // Add to audit log
      const newLog = {
        id: auditLogs.length + 1,
        action: "removed user",
        user: "John Doe",
        timestamp: new Date().toISOString(),
        details: `Removed '${userToRemove.name}' from the board`,
      }
      setAuditLogs([newLog, ...auditLogs])
    }
  }

  const handleBanUser = (userId: number) => {
    const userToBan = members.find((m) => m.id === userId)
    if (userToBan) {
      setMembers(members.filter((member) => member.id !== userId))
      setBannedUsers([...bannedUsers, userToBan])
      // Add to audit log
      const newLog = {
        id: auditLogs.length + 1,
        action: "banned user",
        user: "John Doe",
        timestamp: new Date().toISOString(),
        details: `Banned '${userToBan.name}' from the board`,
      }
      setAuditLogs([newLog, ...auditLogs])
    }
  }

  const handleUnbanUser = (userId: number) => {
    const userToUnban = bannedUsers.find((u) => u.id === userId)
    if (userToUnban) {
      setBannedUsers(bannedUsers.filter((user) => user.id !== userId))
      // Add to audit log
      const newLog = {
        id: auditLogs.length + 1,
        action: "unbanned user",
        user: "John Doe",
        timestamp: new Date().toISOString(),
        details: `Unbanned '${userToUnban.name}'`,
      }
      setAuditLogs([newLog, ...auditLogs])
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

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/board/${params.id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Board Settings</h1>
        </div>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="banned">Banned Users</TabsTrigger>
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
                    <CardTitle>Board Members</CardTitle>
                    <CardDescription>Manage members and their roles within this board.</CardDescription>
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
                          Enter the email address of the person you want to invite to this board.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Label htmlFor="invite-email" className="mb-2 block">
                          Email address
                        </Label>
                        <Input
                          id="invite-email"
                          placeholder="colleague@example.com"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
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
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
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
                            member.role === "admin" ? "default" : member.role === "moderator" ? "secondary" : "outline"
                          }
                          className="capitalize"
                        >
                          {member.role === "admin" && <Shield className="mr-1 h-3 w-3" />}
                          {member.role}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => handleChangeRole(member.id, "admin")}
                              disabled={member.role === "admin"}
                            >
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleChangeRole(member.id, "moderator")}
                              disabled={member.role === "moderator"}
                            >
                              Make Moderator
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleChangeRole(member.id, "member")}
                              disabled={member.role === "member"}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banned">
            <Card>
              <CardHeader>
                <CardTitle>Banned Users</CardTitle>
                <CardDescription>Users who are banned from this board.</CardDescription>
              </CardHeader>
              <CardContent>
                {bannedUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No banned users</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bannedUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
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
                        onClick={() => router.push(`/board/${params.id}/settings/github`)}
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
                            onClick={() => router.push(`/board/${params.id}?tab=github`)}
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
                            onClick={() => router.push(`/board/${params.id}/settings/github`)}
                          >
                            Manage Links
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button variant="outline" onClick={() => router.push(`/board/${params.id}/settings/github`)}>
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
                    <Button onClick={() => router.push(`/board/${params.id}/settings/github`)}>
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
