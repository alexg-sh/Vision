"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
  Ban,
  Building2,
  Check,
  Copy,
  Globe,
  History,
  Loader2,
  Lock,
  MoreHorizontal,
  Save,
  Settings,
  Shield,
  Trash2,
  Upload,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { use } from 'react';

// Define types based on Prisma schema and API responses
interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: string; // ADMIN, MEMBER
  status: string; // ACTIVE, BANNED
  bannedAt: string | null; // ISO date string
  banReason: string | null;
  user: User;
}

interface OrganizationDetails {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
  slug: string;
  userRole: string | null; // Role of the current user in this org
  _count: {
    members: number;
    boards: number;
  };
}

export default function OrganizationSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "general"
  const organizationId = unwrappedParams.id;

  const [organization, setOrganization] = useState<OrganizationDetails | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [activeMembers, setActiveMembers] = useState<OrganizationMember[]>([])
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);

  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isListLoading, setIsListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null)

  // State for dialogs
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteUsername, setInviteUsername] = useState("");
  const [banReason, setBanReason] = useState("");
  const [memberToBan, setMemberToBan] = useState<OrganizationMember | null>(null);
  const [isBanConfirmOpen, setIsBanConfirmOpen] = useState(false);
  const [isUnbanning, setIsUnbanning] = useState<string | null>(null);

  // Form state for editing org details
  const [editedName, setEditedName] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [editedImageUrl, setEditedImageUrl] = useState("")
  const [editedIsPrivate, setEditedIsPrivate] = useState(false)

  // --- Consolidated Fetching Functions ---

  const fetchOrganizationDetails = async () => {
    if (!organizationId) return false;
    setIsFetching(true);
    setError(null);
    try {
      const response = await fetch(`/api/organization/${organizationId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch organization details.");
      }
      const data: OrganizationDetails = await response.json();
      setOrganization(data);
      // Initialize edit form state
      setEditedName(data.name);
      setEditedDescription(data.description || "");
      setEditedImageUrl(data.imageUrl || "");
      setEditedIsPrivate(data.isPrivate);
      return true;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Error fetching organization details.");
      if (err.message.includes("not found") || err.message.includes("Forbidden")) {
        router.push("/dashboard");
      }
      return false;
    } finally {
      setIsFetching(false);
    }
  };

  const fetchMembers = async () => {
    if (!organizationId) return;
    setIsListLoading(true);
    try {
      const response = await fetch(`/api/organization/${organizationId}/members`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch members.");
      }
      const data: OrganizationMember[] = await response.json();
      setMembers(data);
      setActiveMembers(data.filter(m => m.status === 'ACTIVE'));
    } catch (err: any) {
      toast.error(err.message || "Error fetching members list.");
    } finally {
      setIsListLoading(false);
    }
  };

  const fetchBannedUsers = async () => {
    if (!organizationId) return;
    setIsListLoading(true);
    try {
      const response = await fetch(`/api/organization/${organizationId}/bans`);
      if (!response.ok) throw new Error('Failed to fetch banned users');
      const data = await response.json();
      setBannedUsers(data);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching banned users.');
    } finally {
      setIsListLoading(false);
    }
  };

  // --- useEffect Hooks ---

  useEffect(() => {
    fetchOrganizationDetails();
  }, [organizationId]);

  useEffect(() => {
    if (organization && organization.userRole === 'ADMIN') {
      fetchMembers();
      fetchBannedUsers();
    }
  }, [organization]);

  // Derived state for current user
  const currentUserMemberInfo = members.find(m => m.userId === session?.user?.id);
  const currentUserRole = organization?.userRole;
  const isAdmin = currentUserRole === 'ADMIN';

  // --- Handler Functions ---

  const handleSaveSettings = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/organization/${organization.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedName,
          description: editedDescription,
          imageUrl: editedImageUrl,
          isPrivate: editedIsPrivate,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }
      const updatedOrg = await response.json();
      setOrganization(updatedOrg);
      setIsEditing(false);
      toast.success("Organization settings updated successfully!");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Error updating settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/organization/${organization.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete organization');
      }
      toast.success("Organization deleted successfully.");
      setIsDeleteDialogOpen(false);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Error deleting organization.");
      setIsLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (inviteUsername.trim() && organization) {
      setIsLoading(true);
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
        toast.error(error?.message || "Could not send the invitation.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChangeRole = async (targetUserId: string, newRole: string) => {
    if (!organization || !isAdmin || currentUserMemberInfo?.userId === targetUserId) return;

    setIsListLoading(true);
    try {
      const response = await fetch(`/api/organization/${organization.id}/members/${targetUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change role');
      }
      await fetchMembers();
      toast.success(`Role updated to ${newRole}.`);
    } catch (err: any) {
      toast.error(err.message || "Error changing role.");
      setIsListLoading(false);
    }
  };

  const handleRemoveUser = async (targetUserId: string) => {
    if (!organization || !isAdmin || currentUserMemberInfo?.userId === targetUserId) return;

    const memberToRemove = members.find(m => m.userId === targetUserId);
    if (!memberToRemove) return;

    setIsListLoading(true);
    try {
      const response = await fetch(`/api/organization/${organization.id}/members/${targetUserId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove member');
      }
      await fetchMembers();
      await fetchBannedUsers();
      toast.success(`${memberToRemove.user.name || 'Member'} removed from the organization.`);
    } catch (err: any) {
      toast.error(err.message || "Error removing member.");
      setIsListLoading(false);
    }
  };

  const openBanConfirmation = (member: OrganizationMember) => {
    if (!isAdmin || currentUserMemberInfo?.userId === member.userId) return;
    setMemberToBan(member);
    setBanReason("");
    setIsBanConfirmOpen(true);
  };

  const handleBanUser = async () => {
    if (!organization || !isAdmin || !memberToBan || currentUserMemberInfo?.userId === memberToBan.userId) return;

    setIsListLoading(true);
    setIsBanConfirmOpen(false);
    const memberName = memberToBan.user.name || 'Member';
    try {
      const response = await fetch(`/api/organization/${organization.id}/members/${memberToBan.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'BANNED', banReason: banReason || null }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to ban member');
      }
      await fetchMembers();
      await fetchBannedUsers();
      toast.success(`${memberName} has been banned.`);
      setMemberToBan(null);
    } catch (err: any) {
      toast.error(err.message || "Error banning member.");
      setIsListLoading(false);
    }
  };

  const handleUnbanUser = async (targetUserId: string) => {
    if (!organization || !isAdmin) return;

    const userToUnban = bannedUsers.find(u => u.userId === targetUserId);
    if (!userToUnban) {
      toast.error("Could not find the user in the banned list.");
      return;
    }

    setIsUnbanning(targetUserId);
    setIsListLoading(true);
    try {
      const response = await fetch(`/api/organization/${organization.id}/bans/${targetUserId}`, {
        method: 'DELETE',
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to unban member');
      }

      toast.success(responseData.message || "User successfully unbanned.");
      await fetchMembers();
      await fetchBannedUsers();
    } catch (err: any) {
      toast.error(err?.message || "Could not unban the user.");
    } finally {
      setIsUnbanning(null);
      setIsListLoading(false);
    }
  };

  const formatDate = (dateString: string | null | Date) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Render loading state
  if (isFetching || sessionStatus === 'loading') {
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 container py-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  // Render error state or if organization not found
  if (error || !organization) {
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 container py-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">{error || "Organization not found or you do not have permission to view its settings."}</p>
              <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Render settings page only if user is an admin
  if (!isAdmin) {
     return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 container py-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">You must be an administrator to access organization settings.</p>
              <Button onClick={() => router.push(`/organization/${organizationId}`)} className="mt-4">Back to Organization</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Organization Settings</h1>
            <p className="text-muted-foreground">Manage settings for {organization.name}</p>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="members">Members ({activeMembers.length})</TabsTrigger>
              <TabsTrigger value="banned">Banned ({bannedUsers.length})</TabsTrigger>
              <TabsTrigger value="danger">Danger Zone</TabsTrigger>
            </TabsList>

            {/* General Settings Tab */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>General Information</CardTitle>
                      <CardDescription>
                        Manage your organization's basic information and privacy settings.
                      </CardDescription>
                    </div>
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isEditing) {
                          handleSaveSettings();
                        } else {
                          setEditedName(organization.name);
                          setEditedDescription(organization.description || "");
                          setEditedImageUrl(organization.imageUrl || "");
                          setEditedIsPrivate(organization.isPrivate);
                          setIsEditing(true);
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
                          <Settings className="mr-2 h-4 w-4" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative h-32 w-32 rounded-lg overflow-hidden border">
                        <Image
                          src={editedImageUrl || "/placeholder.svg"}
                          alt={editedName}
                          fill
                          className="object-cover"
                          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                        />
                      </div>
                      {isEditing && (
                        <Button variant="outline" size="sm" className="gap-2" disabled>
                          <Upload className="h-4 w-4" />
                          Change Image (WIP)
                        </Button>
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="org-name">Organization name</Label>
                        <Input
                          id="org-name"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          disabled={!isEditing || isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="org-description">Description</Label>
                        <Textarea
                          id="org-description"
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          disabled={!isEditing || isLoading}
                          rows={4}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="private-mode"
                          checked={editedIsPrivate}
                          onCheckedChange={setEditedIsPrivate}
                          disabled={!isEditing || isLoading}
                        />
                        <Label htmlFor="private-mode">Private organization</Label>
                      </div>
                      {editedIsPrivate ? (
                        <div className="bg-muted/50 p-4 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-medium text-sm">Private Organization</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Private organizations are only visible to invited members. They won't appear in public listings.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-muted/50 p-4 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-medium text-sm">Public Organization</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Public organizations are visible to anyone. They may appear in public listings.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Active Members</CardTitle>
                      <CardDescription>Manage members and their roles within the organization.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)} disabled={isLoading}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Members
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isListLoading ? (
                     <div className="flex justify-center items-center py-8">
                       <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                     </div>
                  ) : activeMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No active members found (besides potentially yourself).</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeMembers.map((member) => (
                        <div key={member.id || member.userId || `${member.user?.email || member.user?.name || Math.random()}`}
                          className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.user?.image || "/placeholder-user.jpg"} alt={member.user?.name || 'User'} />
                              <AvatarFallback>{member.user?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {member.user.name || 'Unnamed User'}
                                {member.userId === session?.user?.id && <Badge variant="secondary">You</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">{member.user?.email || ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <Badge
                                variant={member.role === "ADMIN" ? "default" : "secondary"}
                                className="capitalize"
                              >
                                {member.role === "ADMIN" && <Shield className="mr-1 h-3 w-3" />}
                                {member.role.toLowerCase()}
                              </Badge>
                            {isAdmin && member.userId !== session?.user?.id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" disabled={isListLoading}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={() => handleChangeRole(member.userId, "ADMIN")}
                                    disabled={member.role === "ADMIN" || isListLoading}
                                  >
                                    Make Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => handleChangeRole(member.userId, "MEMBER")}
                                    disabled={member.role === "MEMBER" || isListLoading}
                                  >
                                    Make Member
                                  </DropdownMenuItem>
                                  <Separator />
                                  <DropdownMenuItem
                                    onSelect={() => handleRemoveUser(member.userId)}
                                    className="text-destructive focus:text-destructive"
                                    disabled={isListLoading}
                                  >
                                    <UserMinus className="mr-2 h-4 w-4" />
                                    Remove from Organization
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
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Banned Users Tab */}
            <TabsContent value="banned">
              <Card>
                <CardHeader>
                  <CardTitle>Banned Users</CardTitle>
                  <CardDescription>Users who are banned from this organization.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isListLoading ? (
                     <div className="flex justify-center items-center py-8">
                       <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                     </div>
                  ) : bannedUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No banned users</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bannedUsers.map((ban) => (
                        <div key={ban.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={ban.user?.image || "/placeholder-user.jpg"} alt={ban.user?.name || 'User'} />
                              <AvatarFallback>{ban.user?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-muted-foreground line-through">{ban.user?.name || 'Unnamed User'}</p>
                              <p className="text-sm text-muted-foreground">{ban.user?.email || ''}</p>
                              {ban.bannedAt && <p className="text-xs text-muted-foreground">Banned on: {formatDate(ban.bannedAt)}</p>}
                              {ban.banReason && <p className="text-xs text-muted-foreground">Reason: {ban.banReason}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             {ban.banReason && <p className="text-xs text-muted-foreground italic">Reason: {ban.banReason}</p>}
                             {isAdmin && (
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleUnbanUser(ban.userId)}
                                 disabled={isUnbanning === ban.userId || isListLoading}
                               >
                                 {isUnbanning === ban.userId ? (
                                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                 ) : null}
                                 Unban
                               </Button>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Danger Zone Tab */}
            <TabsContent value="danger">
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>
                    Actions in this section can have permanent consequences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2 p-4 border border-dashed rounded-lg">
                    <h3 className="text-lg font-medium">Transfer Ownership</h3>
                    <p className="text-sm text-muted-foreground">
                      Transfer ownership of this organization to another member. This action requires careful consideration.
                    </p>
                    <Button variant="outline" disabled>Transfer Ownership (WIP)</Button>
                  </div>

                  <Separator />

                  <div className="space-y-2 p-4 border border-destructive rounded-lg bg-destructive/5">
                    <h3 className="text-lg font-medium text-destructive">Delete Organization</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this organization and all its boards, posts, and member associations. This action cannot be undone.
                    </p>
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isLoading}>
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Delete Organization
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the organization "
                            <strong>{organization.name}</strong>" and all associated data.
                            Please type the organization name to confirm.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Input
                          id="confirm-delete-input"
                          placeholder={organization.name}
                          onChange={(e) => {
                            const confirmButton = document.getElementById('confirm-delete-button') as HTMLButtonElement | null;
                            if (confirmButton) {
                              confirmButton.disabled = e.target.value !== organization.name;
                            }
                          }}
                        />
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            id="confirm-delete-button"
                            onClick={handleDeleteOrganization}
                            disabled
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isLoading ? 'Deleting...' : 'Delete Permanently'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Members</DialogTitle>
            <DialogDescription>
              Enter the username of the user you want to invite to {organization?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="invite-username">Username</Label>
            <Input
              id="invite-username"
              type="text"
              placeholder="username"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} disabled={isLoading || !inviteUsername.trim()}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isBanConfirmOpen} onOpenChange={setIsBanConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban <strong>{memberToBan?.user.name || 'this member'}</strong>?
              They will be removed from the organization and unable to rejoin or view its content.
              You can optionally provide a reason for the ban.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            id="ban-reason"
            placeholder="Reason for banning (optional)"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            disabled={isLoading}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} onClick={() => setMemberToBan(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Banning...' : 'Confirm Ban'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
