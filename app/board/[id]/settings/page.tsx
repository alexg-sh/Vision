"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
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
  Loader2,
  Mail,
  MoreHorizontal,
  Save,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react"
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

export default function BoardSettingsPage() {
  const params = useParams()
  const boardId = Array.isArray(params.id) ? params.id[0] : params.id

  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "general"
  const [userRole, setUserRole] = useState(searchParams.get("userRole") || "")

  console.log("[BoardSettingsPage] Checking permissions. userRole from query param:", userRole)

  const [boardName, setBoardName] = useState("")
  const [boardDescription, setBoardDescription] = useState("")
  const [boardImage, setBoardImage] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [isGithubConnected, setIsGithubConnected] = useState(true)
  const [githubRepo, setGithubRepo] = useState("acme/project-vision")

  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [editedImage, setEditedImage] = useState("")
  const [editedIsPrivate, setEditedIsPrivate] = useState(false)

  const [isFetchingBoard, setIsFetchingBoard] = useState(true)
  const [isFetchingLists, setIsFetchingLists] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isListLoading, setIsListLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteUsername, setInviteUsername] = useState("")
  const [isBanConfirmOpen, setIsBanConfirmOpen] = useState(false)
  const [memberToModify, setMemberToModify] = useState<Member | null>(null)
  const [banReason, setBanReason] = useState("")
  const [isUnbanning, setIsUnbanning] = useState<string | null>(null)

  useEffect(() => {
    // Try to get the userRole from the board members list (if available)
    // Or fetch from an API if needed
    // For now, try to infer from members or window.session if available
    // This is a fallback; ideally, userRole should be passed as a prop from the parent page
    if (members.length > 0 && typeof window !== 'undefined') {
      const currentUserId = window.sessionStorage.getItem('userId')
      const current = members.find(m => m.id === currentUserId)
      if (current) setUserRole(current.role.toLowerCase())
      // --- ADD: If not found, check if you are the creator (role === 'CREATOR') ---
      if (!current) {
        // Try to find a member with role 'CREATOR' and currentUserId
        const creator = members.find(m => m.role === 'CREATOR' && m.id === currentUserId)
        if (creator) setUserRole('creator')
      }
    }
  }, [members])

  const fetchBoardDetails = useCallback(async () => {
    if (!boardId) return false
    setIsFetchingBoard(true)
    setError(null)
    try {
      const res = await fetch(`/api/boards/${boardId}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const message = err.message || "Failed to load board"
        throw new Error(message)
      }
      const data = await res.json()
      setBoardName(data.name)
      setBoardDescription(data.description || "")
      setBoardImage(data.image || "")
      setIsPrivate(data.isPrivate)
      setEditedName(data.name)
      setEditedDescription(data.description || "")
      setEditedImage(data.image || "")
      setEditedIsPrivate(data.isPrivate)
      return true
    } catch (err: any) {
      console.error("Error loading board:", err)
      setError(err.message)
      toast({ variant: "destructive", title: "Error Loading Board", description: err.message })
      if (err.message.includes("not found") || err.message.includes("Forbidden")) {
        router.push("/dashboard")
      }
      return false
    } finally {
      setIsFetchingBoard(false)
    }
  }, [boardId, toast, router])

  const fetchMembers = useCallback(async () => {
    if (!boardId) return false
    setIsFetchingLists(true)
    try {
      const res = await fetch(`/api/boards/${boardId}/members`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const message = errorData.message || "Could not fetch board members."
        if (res.status === 403) {
          toast({ variant: "destructive", title: "Access Denied", description: message })
          router.push("/dashboard")
          return false
        }
        throw new Error(message)
      }
      const data = await res.json()
      setMembers(data)
      return true
    } catch (err: any) {
      console.error("Error fetching members:", err)
      toast({ variant: "destructive", title: "Error Loading Members", description: err.message })
      return false
    } finally {
      setIsFetchingLists(false)
    }
  }, [boardId, toast, router])

  useEffect(() => {
    if (boardId) {
      fetchBoardDetails()
      fetchMembers()
    }
  }, [boardId, fetchBoardDetails, fetchMembers])

  const handleSaveSettings = async () => {
    if (!boardId) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedName,
          description: editedDescription,
          image: editedImage,
          isPrivate: editedIsPrivate,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Update failed")
      }
      const updated = await response.json()
      setBoardName(updated.name)
      setBoardDescription(updated.description || "")
      setBoardImage(updated.image || "")
      setIsPrivate(updated.isPrivate)
      setIsEditing(false)
      toast({ title: "Settings Saved", description: "Board settings updated successfully." })
    } catch (error: any) {
      console.error("Error saving settings:", error)
      setError(error.message)
      toast({ variant: "destructive", title: "Save Failed", description: error.message })
      fetchBoardDetails()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBoard = async () => {
    if (!boardId) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to delete board")
      }
      toast({ title: "Board Deleted", description: "The board has been permanently deleted." })
      setIsDeleteDialogOpen(false)
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error deleting board:", error)
      setError(error.message)
      toast({ variant: "destructive", title: "Deletion Failed", description: error.message })
      setIsLoading(false)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteUsername.trim() || !boardId) return
    setIsLoading(true)
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
      toast({ title: "Invite Sent", description: responseData.message || `Invitation sent to ${inviteUsername}.` })
      setInviteUsername("")
      setIsInviteDialogOpen(false)
    } catch (error: any) {
      console.error("Error sending invite:", error)
      toast({ variant: "destructive", title: "Invite Failed", description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    const memberToUpdate = members.find((m) => m.id === userId)
    if (!memberToUpdate || !boardId) return

    setIsListLoading(true)
    try {
      const response = await fetch(`/api/boards/${boardId}/members/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update role")
      }
      await fetchMembers()
      toast({
        title: "Role Updated",
        description: `${memberToUpdate.name || "User"}'s role updated to ${newRole.toLowerCase()}.`,
      })
    } catch (error: any) {
      console.error("Error updating role:", error)
      toast({ variant: "destructive", title: "Update Failed", description: error.message })
      setIsListLoading(false)
    }
  }

  const openRemoveConfirmation = (member: Member) => {
    setMemberToModify(member)
    if (window.confirm(`Are you sure you want to remove ${member.name || "this user"} from the board?`)) {
      handleRemoveUser(member.id)
    }
  }

  const openBanConfirmation = (member: Member) => {
    setMemberToModify(member)
    setBanReason("")
    setIsBanConfirmOpen(true)
  }

  const handleRemoveUser = async (userId: string) => {
    const userToRemove = members.find((m) => m.id === userId)
    if (!userToRemove || !boardId) return

    setIsListLoading(true)
    try {
      const response = await fetch(`/api/boards/${boardId}/members/${userId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to remove user")
      }
      toast({
        title: "User Removed",
        description: `${userToRemove.name || "User"} has been removed from the board.`,
      })
      await fetchMembers()
    } catch (error: any) {
      console.error("Error removing user:", error)
      toast({ variant: "destructive", title: "Removal Failed", description: error.message })
      setIsListLoading(false)
    }
  }

  const handleBanUser = async () => {
    if (!memberToModify || !boardId) return
    const userId = memberToModify.id
    const userName = memberToModify.name || "User"

    setIsListLoading(true)
    setIsBanConfirmOpen(false)
    try {
      const response = await fetch(`/api/boards/${boardId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "BANNED",
          banReason: banReason || null,
        }),
      })
      if (!response.ok) {
        const responseData = await response.json().catch(() => ({}))
        throw new Error(responseData.message || "Failed to ban user")
      }
      toast({ title: "User Banned", description: `${userName} has been banned from the board.` })
      await fetchMembers()
      setMemberToModify(null)
    } catch (error: any) {
      console.error("Error banning user:", error)
      toast({ variant: "destructive", title: "Ban Failed", description: error.message })
      setIsListLoading(false)
    }
  }

  const handleUnbanUser = async (userId: string) => {
    const userToUnban = members.find((m) => m.id === userId && m.status === "BANNED")
    if (!userToUnban || !boardId) return

    setIsUnbanning(userId)
    setIsListLoading(true)
    try {
      const response = await fetch(`/api/boards/${boardId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      })

      if (!response.ok) {
        const responseData = await response.json().catch(() => ({}))
        throw new Error(responseData.message || "Failed to unban user")
      }

      toast({ title: "User Unbanned", description: `${userToUnban.name || "User"} has been unbanned.` })
      await fetchMembers()
    } catch (error: any) {
      console.error("Error unbanning user:", error)
      toast({ variant: "destructive", title: "Unban Failed", description: error.message })
    } finally {
      setIsUnbanning(null)
      setIsListLoading(false)
    }
  }

  const formatDate = (dateString: string | null | Date) => {
    if (!dateString) return "N/A"
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

  if (isFetchingBoard || isFetchingLists) {
    return (
      <main className="flex-1 container py-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    )
  }

  if (error && !isFetchingBoard) {
    return (
      <main className="flex-1 container py-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <Button onClick={() => router.push("/dashboard")} className="mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!boardId || !boardName) {
    return (
      <main className="flex-1 container py-6 flex items-center justify-center">
        <p className="text-muted-foreground">Board not found or could not be loaded.</p>
      </main>
    )
  }

  if (userRole !== 'admin' && userRole !== 'moderator' && userRole !== 'creator') {
    console.log("[BoardSettingsPage] Permission denied. Role was:", userRole)
    return (
      <main className="flex-1 container py-6 flex items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to view board settings.</p>
      </main>
    )
  }

  console.log("[BoardSettingsPage] Permission granted. Role:", userRole)

  return (
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
                  onClick={() => {
                    if (isEditing) {
                      handleSaveSettings()
                    } else {
                      setEditedName(boardName)
                      setEditedDescription(boardDescription)
                      setEditedImage(boardImage)
                      setEditedIsPrivate(isPrivate)
                      setIsEditing(true)
                    }
                  }}
                  disabled={isLoading}
                >
                  {isLoading && isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  disabled={!isEditing || isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="board-description">Description</Label>
                <Textarea
                  id="board-description"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  disabled={!isEditing || isLoading}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="board-image">Board image URL</Label>
                <Input
                  id="board-image"
                  value={editedImage}
                  onChange={(e) => setEditedImage(e.target.value)}
                  disabled={!isEditing || isLoading}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="private-mode"
                  checked={editedIsPrivate}
                  onCheckedChange={setEditedIsPrivate}
                  disabled={!isEditing || isLoading}
                />
                <Label htmlFor="private-mode">Private board</Label>
              </div>
              {editedIsPrivate && (
                <p className="text-sm text-muted-foreground">Private boards are only visible to invited members.</p>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6 flex flex-col items-start">
              <h3 className="text-lg font-medium mb-2">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete a board, there is no going back. Please be certain.
              </p>
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isLoading}>
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
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteBoard}
                      disabled={isLoading}
                      className="bg-destructive text-destructive-foreground"
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                    <Button disabled={isLoading}>
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
                        disabled={isLoading}
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleInviteUser} disabled={isLoading || !inviteUsername.trim()}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Invitation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              {isFetchingLists ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
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
                            <Button variant="ghost" size="icon" disabled={isListLoading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => handleChangeRole(member.id, "ADMIN")}
                              disabled={member.role === "ADMIN" || isListLoading}
                            >
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleChangeRole(member.id, "MODERATOR")}
                              disabled={member.role === "MODERATOR" || isListLoading}
                            >
                              Make Moderator
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleChangeRole(member.id, "MEMBER")}
                              disabled={member.role === "MEMBER" || isListLoading}
                            >
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => openRemoveConfirmation(member)}
                              className="text-destructive focus:text-destructive"
                              disabled={isListLoading}
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              Remove from Board
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => openBanConfirmation(member)}
                              className="text-destructive focus:text-destructive"
                              disabled={isListLoading}
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
              {isFetchingLists ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnbanUser(user.id)}
                        disabled={isUnbanning === user.id || isListLoading}
                      >
                        {isUnbanning === user.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
              <CardDescription>Track actions performed on this board. (Data fetched separately)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Audit log display component goes here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isBanConfirmOpen} onOpenChange={setIsBanConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban {memberToModify?.name || "User"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Banning this user will prevent them from accessing the board. Provide an optional reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            id="ban-reason"
            placeholder="Reason for banning (optional)"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            disabled={isListLoading}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isListLoading} onClick={() => setMemberToModify(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              disabled={isListLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isListLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Ban
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
