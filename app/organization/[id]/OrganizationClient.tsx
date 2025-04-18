"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation" // Import useRouter
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
import { toast } from "sonner"; // Import toast from sonner
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
  Loader2,
  LogIn // Add LogIn icon
} from "lucide-react"
import { OrganizationWithDetails } from "./page" // Import the type from page.tsx
import { Prisma } from '@prisma/client'; // Import Prisma for types

// Define types for nested relations based on OrganizationWithDetails
type BoardWithCounts = OrganizationWithDetails['boards'][number];
type MemberWithUser = OrganizationWithDetails['members'][number];
type AuditLogWithUser = OrganizationWithDetails['auditLogs'][number];

// Helper function (can be moved to utils)
const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

interface OrganizationClientProps {
  organization: OrganizationWithDetails
  userRole: string // 'admin', 'moderator', 'member', 'guest'
  userId: string | null // ID of the current user, null if not logged in
}

export default function OrganizationClient({ organization, userRole, userId }: OrganizationClientProps) {
  const router = useRouter() // Use useRouter hook
  const [isCreateBoardDialogOpen, setIsCreateBoardDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [newBoardDescription, setNewBoardDescription] = useState("")
  const [newBoardImage, setNewBoardImage] = useState("/placeholder.svg?height=200&width=400")
  const [isPrivate, setIsPrivate] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isJoinLoading, setIsJoinLoading] = useState(false);

  const isAdmin = userRole === "admin"
  const isModerator = userRole === "moderator" || isAdmin

  const handleCreateBoard = async () => {
    if (newBoardName.trim()) {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/organization/${organization.id}/boards`, { // Placeholder API endpoint
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newBoardName,
            description: newBoardDescription,
            image: newBoardImage,
            isPrivate: isPrivate,
            organizationId: organization.id,
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to create board');
        }
        // Optionally, refresh data or redirect
        router.refresh(); // Refresh server component data
        setIsCreateBoardDialogOpen(false);
        // Reset form
        setNewBoardName("");
        setNewBoardDescription("");
        setNewBoardImage("/placeholder.svg?height=200&width=400");
        setIsPrivate(false);
      } catch (error) {
        console.error("Error creating board:", error);
        // TODO: Show error to user
      } finally {
        setIsLoading(false);
      }
    }
  }

  const handleInviteUser = async () => {
    if (inviteEmail.trim()) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/organization/${organization.id}/invites`, { // Placeholder API endpoint
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inviteEmail }),
        });
        if (!response.ok) {
          throw new Error('Failed to send invite');
        }
        alert(`Invitation sent to ${inviteEmail}`); // Simple feedback
        setInviteEmail("");
        setIsInviteDialogOpen(false);
      } catch (error) {
        console.error("Error sending invite:", error);
        // TODO: Show error to user
      } finally {
        setIsLoading(false);
      }
    }
  }

  const handleJoinOrganization = async () => {
    if (!userId || !organization || organization.isPrivate) return; // Should not happen if button logic is correct

    setIsJoinLoading(true);
    try {
      const response = await fetch(`/api/organization/${organization.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // No body needed, user is identified by session
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join organization');
      }

      // Successfully joined
      toast.success(`Successfully joined ${organization.name}!`);
      // Refresh the page or update state to reflect new membership status
      router.refresh(); // Simple way to reload server component data

    } catch (error: any) {
      console.error("Error joining organization:", error);
      toast.error(error.message || "Could not join the organization.");
    } finally {
      setIsJoinLoading(false);
    }
  };

  const handleLeaveOrganization = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/organization/${organization.id}/members/${userId}`, { // Placeholder API endpoint
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to leave organization');
      }
      router.push("/dashboard"); // Redirect after leaving
    } catch (error) {
      console.error("Error leaving organization:", error);
      // TODO: Show error to user
      setIsLoading(false); // Only stop loading if there's an error
    }
    // No finally block needed if redirecting on success
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        {/* Header Section */}
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
        {/* Action Buttons */}
        <div className="flex gap-2">
          {isModerator && (
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isLoading}>
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
                        disabled={isLoading}
                      />
                      <Button onClick={handleInviteUser} disabled={isLoading || !inviteEmail.trim()}>
                        {isLoading ? "Inviting..." : "Invite"}
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} disabled={isLoading}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {isModerator && (
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
                  <DialogDescription>Give your board a name, description, and privacy setting.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Form fields for new board */}
                  <div className="space-y-2">
                    <Label htmlFor="board-name">Board name</Label>
                    <Input
                      id="board-name"
                      placeholder="e.g., Feature Requests"
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                      disabled={isLoading}
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
                    <Switch id="private-mode" checked={isPrivate} onCheckedChange={setIsPrivate} disabled={isLoading} />
                    <Label htmlFor="private-mode">Private board</Label>
                  </div>
                  {isPrivate && (
                    <p className="text-sm text-muted-foreground">
                      Private boards are only visible to invited members.
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateBoardDialogOpen(false)} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBoard} disabled={isLoading || !newBoardName.trim()}>
                    {isLoading ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {isAdmin && (
            <Button variant="outline" onClick={() => router.push(`/organization/${organization.id}/settings`)} disabled={isLoading}>
              <Settings className="mr-2 h-4 w-4" />
              Organization Settings
            </Button>
          )}

          {/* Show Join button if logged in, not a member (is guest), and org is public */}
          {userId && userRole === 'guest' && !organization.isPrivate && (
            <Button onClick={handleJoinOrganization} disabled={isJoinLoading || isLoading}>
              {isJoinLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Join Organization
            </Button>
          )}

          {/* Show Leave button if logged in and IS a member (but not admin) */}
          {userId && userRole !== 'guest' && !isAdmin && (
            <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" disabled={isLoading}>
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
                  <Button variant="outline" onClick={() => setIsLeaveDialogOpen(false)} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleLeaveOrganization} disabled={isLoading}>
                    {isLoading ? "Leaving..." : "Leave Organization"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">{organization._count.members} members</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">{organization._count.boards} boards</span>
        </div>
        {isModerator && ( // Show audit log link only to moderators/admins
          <div className="ml-auto">
            <Link href={`/organization/${organization.id}/audit-log`}>
              <Button variant="outline" size="sm" className="gap-1">
                <History className="h-4 w-4" />
                View Audit Log
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="boards">
        <TabsList className="mb-6">
          <TabsTrigger value="boards">Boards</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          {isModerator && <TabsTrigger value="activity">Activity</TabsTrigger>} {/* Show activity only to moderators/admins */}
        </TabsList>

        {/* Boards Tab */}
        <TabsContent value="boards" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organization.boards.map((board: BoardWithCounts) => (
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
                        {/* Placeholder for post count - needs aggregation */}
                        <span>{board._count?.posts ?? 0} posts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {/* Placeholder for member count - needs relation/aggregation */}
                        <span>{board._count?.members ?? 1} members</span>
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
                  onClick={() => setIsCreateBoardDialogOpen(true)}
                  disabled={isLoading}
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

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Organization Members</CardTitle>
                  <CardDescription>Manage members and their roles within the organization.</CardDescription>
                </div>
                {isModerator && (
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)} disabled={isLoading}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Members
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organization.members.map((member: MemberWithUser) => (
                  <div key={member.userId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.user.image || "/placeholder-user.jpg"} alt={member.user.name || 'User'} />
                        <AvatarFallback>{member.user.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user.name || 'Unnamed User'}</p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        member.role === "ADMIN" ? "default" : member.role === "MODERATOR" ? "secondary" : "outline"
                      }
                      className="capitalize" // Make roles like ADMIN look nicer
                    >
                      {member.role.toLowerCase()}
                    </Badge>
                    {/* TODO: Add role change dropdown for admins */}
                  </div>
                ))}
              </div>
            </CardContent>
            {/* Optionally add pagination or "View All Members" link if list is long */}
            {/* <CardFooter>
              <Link href={`/organization/${organization.id}/members`}>
                <Button variant="outline">View All Members</Button>
              </Link>
            </CardFooter> */}
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        {isModerator && (
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
                  <Link href={`/organization/${organization.id}/audit-log`}>
                    <Button variant="outline" size="sm">
                      <History className="mr-2 h-4 w-4" />
                      View Full Audit Log
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {organization.auditLogs.length === 0 ? (
                     <p className="text-sm text-muted-foreground text-center py-4">No recent activity found.</p>
                  ) : (
                    organization.auditLogs.map((log: AuditLogWithUser) => (
                      <div key={log.id} className="flex gap-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-2">
                            {/* TODO: Icon based on action type */}
                            <Clock className="h-4 w-4" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <div>
                              <span className="font-medium">{log.user?.name || 'System'}</span>{" "}
                              <span className="text-muted-foreground">{log.action}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{formatDate(log.createdAt)}</span>
                          </div>
                          <p className="text-sm mt-1">{log.details}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </>
  )
}

