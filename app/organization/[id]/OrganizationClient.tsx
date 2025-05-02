"use client"

import { useState, useEffect } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner";
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
  LogIn,
  Ban,
  Undo
} from "lucide-react"
import { OrganizationWithDetails } from "./page"

type BoardWithCounts = OrganizationWithDetails['boards'][number];
type MemberWithUser = OrganizationWithDetails['members'][number];
type AuditLogWithUser = OrganizationWithDetails['auditLogs'][number];

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
  userRole: string
  userId: string | null
}

export default function OrganizationClient({ organization, userRole, userId }: OrganizationClientProps) {
  const router = useRouter()
  const [isCreateBoardDialogOpen, setIsCreateBoardDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [newBoardDescription, setNewBoardDescription] = useState("")
  const [newBoardImage, setNewBoardImage] = useState("/placeholder.svg?height=200&width=400")
  const [isPrivate, setIsPrivate] = useState(false)
  const [inviteUsername, setInviteUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false);
  const [isJoinLoading, setIsJoinLoading] = useState(false);
  const [isUnbanning, setIsUnbanning] = useState<string | null>(null);
  const [isBanConfirmOpen, setIsBanConfirmOpen] = useState(false);
  const [memberToBan, setMemberToBan] = useState<MemberWithUser | null>(null);
  const [banReason, setBanReason] = useState("");

  const isAdmin = userRole === "admin"
  const isModerator = userRole === "moderator" || isAdmin

  const canManageSettings = userRole === 'admin' || userRole === 'moderator' || userRole === 'creator';

  const visibleBoards = userRole === 'guest'
    ? organization.boards.filter(b => !b.isPrivate)
    : organization.boards;

  const handleCreateBoard = async () => {
    if (newBoardName.trim()) {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/organization/${organization.id}/boards`, {
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
        router.refresh();
        setIsCreateBoardDialogOpen(false);
        setNewBoardName("");
        setNewBoardDescription("");
        setNewBoardImage("/placeholder.svg?height=200&width=400");
        setIsPrivate(false);
      } catch (error) {
        console.error("Error creating board:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }

  const handleInviteUser = async () => {
    if (inviteUsername.trim()) {
      setInviteLoading(true);
      try {
        const response = await fetch(`/api/invites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: inviteUsername,
            organizationId: organization.id
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.message || 'Failed to send invite');
        }

        toast.success(responseData.message || `Invitation sent to ${inviteUsername}`);
        setInviteUsername("");
        setIsInviteDialogOpen(false);
      } catch (error: any) {
        console.error("Error sending invite:", error);
        toast.error("Error sending invite", {
            description: error.message || "Could not send the invitation."
        });
      } finally {
        setInviteLoading(false);
      }
    }
  }

  const handleJoinOrganization = async () => {
    if (!userId || !organization || organization.isPrivate) return;

    setIsJoinLoading(true);
    console.log("Attempting to join organization:", organization.id);
    try {
      const response = await fetch(`/api/organization/${organization.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log("Join API Response Status:", response.status);

      const responseClone = response.clone();
      let responseData = {};
      try {
        responseData = await responseClone.json();
        console.log("Join API Response Body:", responseData);
      } catch (jsonError) {
        console.error("Failed to parse response JSON:", jsonError);
        try {
          const responseText = await responseClone.text();
          console.log("Join API Response Text:", responseText);
        } catch (textError) {
          console.error("Failed to read response text:", textError);
        }
      }


      if (!response.ok) {
        console.log("Response not OK. Status:", response.status);
        if (response.status === 403 && (responseData as { banDetails?: { reason: string; bannedAt: string; appealInfo: string } }).banDetails) {
          const { reason, bannedAt, appealInfo } = (responseData as { banDetails: { reason: string; bannedAt: string; appealInfo: string } }).banDetails;
          const formattedDate = bannedAt !== "N/A" ? new Date(bannedAt).toLocaleDateString() : "N/A";
          toast.error("Cannot Join: Banned", {
            description: `Reason: ${reason}\nBanned On: ${formattedDate}\n${appealInfo}`,
            duration: 10000,
          });
        } else {
          throw new Error((responseData as { message?: string }).message || "Failed to join organization.");
        }
        return;
      }

      console.log("Successfully joined organization.");
      toast.success(`Successfully joined ${organization.name}!`);
      router.refresh();

    } catch (error: any) {
      console.error("Error in handleJoinOrganization catch block:", error);
      if (!(error.message?.includes('Cannot Join: Banned'))) {
         console.log("Showing generic error toast for caught error.");
         toast.error("Error", {
            description: error.message || "Could not join the organization."
         });
      } else {
         console.log("Caught error message includes 'Cannot Join: Banned', suppressing generic toast.");
      }
    } finally {
      console.log("Finishing join attempt.");
      setIsJoinLoading(false);
    }
  };

  const handleUnbanUser = async (userIdToUnban: string) => {
    if (!isAdmin) return;
    
    const userToUnban = organization.members.find(m => m.userId === userIdToUnban);
    if (!userToUnban) return;

    setIsUnbanning(userIdToUnban);
    console.log(`Attempting to unban user: ${userIdToUnban} in org: ${organization.id}`);

    try {
      const response = await fetch(`/api/organization/${organization.id}/bans/${userIdToUnban}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();
      console.log(`Unban API Response Status: ${response.status}`, responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `Failed to unban user. Status: ${response.status}`);
      }
      
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: organization.id,
          action: 'UNBAN_USER',
          entityType: 'USER',
          entityId: userIdToUnban,
          entityName: userToUnban.user.name || 'User',
          details: {
            organizationId: organization.id,
            organizationName: organization.name,
            unbannedBy: userId
          }
        })
      });

      toast.success(responseData.message || "User successfully unbanned.");
      router.refresh();

    } catch (error: any) {
      console.error("Error unbanning user:", error);
      toast.error("Error", {
        description: error.message || "Could not unban the user."
      });
    } finally {
      setIsUnbanning(null);
  }
};

  const handleBanUser = async (userId: string, reason: string) => {
    if (!isAdmin) return;
    
    const userToBan = organization.members.find(m => m.userId === userId);
    if (!userToBan) return;

    try {
      const response = await fetch(`/api/organization/${organization.id}/bans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          reason: reason
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to ban user. Status: ${response.status}`);
      }
      
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: organization.id,
          action: 'BAN_USER',
          entityType: 'USER',
          entityId: userId,
          entityName: userToBan.user.name || 'User',
          details: {
            organizationId: organization.id,
            organizationName: organization.name,
            reason: reason,
            bannedBy: userId
          }
        })
      });

      toast.success(responseData.message || "User successfully banned.");
      setIsBanConfirmOpen(false);
      setMemberToBan(null);
      setBanReason("");
      router.refresh();

    } catch (error: any) {
      console.error("Error banning user:", error);
      toast.error("Error", {
        description: error.message || "Could not ban the user."
      });
    }
  };

  const handleLeaveOrganization = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/organization/${organization.id}/members/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to leave organization');
      }
      router.push("/dashboard");
    } catch (error) {
      console.error("Error leaving organization:", error);
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        {/* Header Section */}
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-lg overflow-hidden">
            <Image
              src={organization.imageUrl || "/placeholder.svg"}
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
                {/* Use inviteLoading state */}
                <Button variant="outline" disabled={inviteLoading}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Members
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Members</DialogTitle> {/* Changed title */}
                  <DialogDescription>
                    Enter the username of the person you want to invite to collaborate in this organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-username">Username</Label> {/* Changed label */}
                    <div className="flex gap-2">
                      <Input
                        id="invite-username"
                        placeholder="username"
                        type="text"
                        value={inviteUsername}
                        onChange={(e) => setInviteUsername(e.target.value)}
                        disabled={inviteLoading}
                      />
                      {/* Use inviteLoading state for button */}
                      <Button onClick={handleInviteUser} disabled={inviteLoading || !inviteUsername.trim()}>
                        {inviteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Invite"} {/* Changed button text */}
                      </Button>
                    </div>
                  </div>
                  {/* Add more invite options if needed, e.g., role selection */}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} disabled={inviteLoading}>
                    Cancel {/* Changed from Close */}
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

          {canManageSettings && (
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
        {isModerator && (
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
            {visibleBoards.map((board: BoardWithCounts) => (
              <Link key={board.id} href={`/board/${board.id}`}>
                <Card className="h-full hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors overflow-hidden">
                  <div className="relative h-40 w-full">
                    <Image src={board.imageUrl || "/placeholder.svg"} alt={board.name} fill className="object-cover" />
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
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)} disabled={inviteLoading}>
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
                        <AvatarImage src={member.user.image || "/placeholder-user.jpg"} alt={member.user.name || 'User'} /> {/* Corrected: Use image */}
                        <AvatarFallback>{member.user.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user.name || 'Unnamed User'}</p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                        {member.status === 'BANNED' && (
                          <p className="text-xs text-destructive">Banned: {member.banReason || 'No reason provided'}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          member.status === 'BANNED' ? 'destructive' :
                          member.role === "ADMIN" ? "default" : member.role === "MODERATOR" ? "secondary" : "outline"
                        }
                        className="capitalize"
                      >
                        {member.status === 'BANNED' ? 'Banned' : member.role.toLowerCase()}
                      </Badge>
                      {/* Unban Button - Show only if user is BANNED and current user is ADMIN */}
                      {isAdmin && member.status === 'BANNED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnbanUser(member.userId)}
                          disabled={isUnbanning === member.userId}
                        >
                          {isUnbanning === member.userId ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Unban
                        </Button>
                      )}
                      {/* TODO: Add role change dropdown for admins (for non-banned users) */}
                    </div>
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

