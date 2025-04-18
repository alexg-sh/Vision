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
  const [bannedMembers, setBannedMembers] = useState<OrganizationMember[]>([])
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);

  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for dialogs
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [banReason, setBanReason] = useState("");
  const [memberToBan, setMemberToBan] = useState<OrganizationMember | null>(null);
  const [isBanConfirmOpen, setIsBanConfirmOpen] = useState(false);

  // Form state for editing org details
  const [editedName, setEditedName] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [editedImageUrl, setEditedImageUrl] = useState("")
  const [editedIsPrivate, setEditedIsPrivate] = useState(false)

  // Fetch organization details
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!organizationId) return;
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
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message || "Error fetching organization details.");
        // Redirect if not found or forbidden
        if (err.message.includes("not found") || err.message.includes("Forbidden")) {
          router.push("/dashboard");
        }
      } finally {
        setIsFetching(false);
      }
    };
    fetchOrganization();
  }, [organizationId, router]);

  // Fetch organization members
  useEffect(() => {
    const fetchMembers = async () => {
      if (!organizationId) return;
      // No need to set fetching state here, handled by org fetch
      try {
        const response = await fetch(`/api/organization/${organizationId}/members`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch members.");
        }
        const data: OrganizationMember[] = await response.json();
        setMembers(data);
        setActiveMembers(data.filter(m => m.status === 'ACTIVE'));
        setBannedMembers(data.filter(m => m.status === 'BANNED'));
      } catch (err: any) {
        // Don't overwrite org fetch error
        if (!error) setError(err.message);
        toast.error(err.message || "Error fetching members.");
      }
    };
    // Fetch members only after org details are fetched (and user role is confirmed)
    if (organization) {
        fetchMembers();
    }
  }, [organizationId, organization, error]); // Re-fetch if org changes or initial error clears

  // Fetch banned users
  useEffect(() => {
    const fetchBannedUsers = async () => {
      if (!organizationId) return;
      try {
        const response = await fetch(`/api/organization/${organizationId}/bans`);
        if (!response.ok) throw new Error('Failed to fetch banned users');
        const data = await response.json();
        setBannedUsers(data);
      } catch (err: any) {
        toast.error(err.message || 'Error fetching banned users.');
      }
    };
    fetchBannedUsers();
  }, [organizationId]);

  // Derived state for current user
  const currentUserMemberInfo = members.find(m => m.userId === session?.user?.id);
  const currentUserRole = organization?.userRole; // Use role from organization fetch
  const isAdmin = currentUserRole === 'ADMIN';

  // --- Handler Functions (to be implemented) ---

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
      setOrganization(updatedOrg); // Update local state with response
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
      setIsLoading(false); // Stop loading only on error
    }
    // No finally block needed if redirecting on success
  };

  const handleInviteUser = () => {
    if (inviteEmail.trim() && organization) {
      // TODO: Implement actual invite API call
      console.log(`Inviting ${inviteEmail} to ${organization.name}`);
      toast.info(`(Not Implemented) Invitation would be sent to ${inviteEmail}`);
      setInviteEmail("");
      setIsInviteDialogOpen(false);
    }
  };

  const handleChangeRole = async (targetUserId: string, newRole: string) => {
    if (!organization || !isAdmin || currentUserMemberInfo?.userId === targetUserId) return; // Prevent self-role change here

    setIsLoading(true); // Consider member-specific loading state if needed
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
      const updatedMember: OrganizationMember = await response.json();
      // Update local state
      setMembers(prev => prev.map(m => m.userId === targetUserId ? updatedMember : m));
      setActiveMembers(prev => prev.map(m => m.userId === targetUserId ? updatedMember : m));
      toast.success(`Role for ${updatedMember.user.name} updated to ${newRole}.`);
    } catch (err: any) {
      toast.error(err.message || "Error changing role.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (targetUserId: string) => {
    if (!organization || !isAdmin || currentUserMemberInfo?.userId === targetUserId) return; // Prevent self-removal here

    const memberToRemove = members.find(m => m.userId === targetUserId);
    if (!memberToRemove) return;

    // Optional: Add confirmation dialog here

    setIsLoading(true);
    try {
      const response = await fetch(`/api/organization/${organization.id}/members/${targetUserId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove member');
      }
      // Update local state
      setMembers(prev => prev.filter(m => m.userId !== targetUserId));
      setActiveMembers(prev => prev.filter(m => m.userId !== targetUserId));
      setBannedMembers(prev => prev.filter(m => m.userId !== targetUserId)); // Also remove if they were banned
      toast.success(`${memberToRemove.user.name || 'Member'} removed from the organization.`);
    } catch (err: any) {
      toast.error(err.message || "Error removing member.");
    } finally {
      setIsLoading(false);
    }
  };

  const openBanConfirmation = (member: OrganizationMember) => {
    if (!isAdmin || currentUserMemberInfo?.userId === member.userId) return;
    setMemberToBan(member);
    setBanReason(""); // Reset reason
    setIsBanConfirmOpen(true);
  };

  const handleBanUser = async () => {
    if (!organization || !isAdmin || !memberToBan || currentUserMemberInfo?.userId === memberToBan.userId) return;

    setIsLoading(true);
    setIsBanConfirmOpen(false); // Close confirmation dialog
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
      const updatedMember: OrganizationMember = await response.json();
      // Update local state
      setMembers(prev => prev.map(m => m.userId === memberToBan.userId ? updatedMember : m));
      setActiveMembers(prev => prev.filter(m => m.userId !== memberToBan.userId));
      setBannedMembers(prev => [...prev, updatedMember]);
      toast.success(`${memberToBan.user.name || 'Member'} has been banned.`);
      setMemberToBan(null); // Clear selected member
    } catch (err: any) {
      toast.error(err.message || "Error banning member.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbanUser = async (targetUserId: string) => {
    if (!organization || !isAdmin) return;

    const memberToUnban = bannedMembers.find(m => m.userId === targetUserId);
    if (!memberToUnban) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/organization/${organization.id}/members/${targetUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }), // Unbanning sets status to ACTIVE
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unban member');
      }
      const updatedMember: OrganizationMember = await response.json();
      // Update local state
      setMembers(prev => prev.map(m => m.userId === targetUserId ? updatedMember : m));
      setBannedMembers(prev => prev.filter(m => m.userId !== targetUserId));
      setActiveMembers(prev => [...prev, updatedMember]);
      toast.success(`${memberToUnban.user.name || 'Member'} has been unbanned.`);
    } catch (err: any) {
      toast.error(err.message || "Error unbanning member.");
    } finally {
      setIsLoading(false);
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

  // --- JSX --- (To be updated in the next step)
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
              <TabsTrigger value="banned">Banned ({bannedMembers.length})</TabsTrigger>
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
                          // Reset form to current org state before editing
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
                          src={editedImageUrl || "/placeholder.svg"} // Use edited state
                          alt={editedName} // Use edited state
                          fill
                          className="object-cover"
                          onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }} // Fallback image
                        />
                      </div>
                      {isEditing && (
                        <Button variant="outline" size="sm" className="gap-2" disabled>
                          <Upload className="h-4 w-4" />
                          Change Image (WIP)
                        </Button>
                        // TODO: Implement image upload functionality
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="org-name">Organization name</Label>
                        <Input
                          id="org-name"
                          value={editedName} // Use edited state
                          onChange={(e) => setEditedName(e.target.value)}
                          disabled={!isEditing || isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="org-description">Description</Label>
                        <Textarea
                          id="org-description"
                          value={editedDescription} // Use edited state
                          onChange={(e) => setEditedDescription(e.target.value)}
                          disabled={!isEditing || isLoading}
                          rows={4}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="private-mode"
                          checked={editedIsPrivate} // Use edited state
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
                    {/* TODO: Implement Invite functionality */}
                    <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)} disabled={isLoading}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Members (WIP)
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeMembers.length === 0 ? (
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
                              {/* Change p to div to allow nesting Badge (which renders a div) */}
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
                                  <Button variant="ghost" size="icon" disabled={isLoading}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={() => handleChangeRole(member.userId, "ADMIN")}
                                    disabled={member.role === "ADMIN" || isLoading}
                                  >
                                    Make Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => handleChangeRole(member.userId, "MEMBER")}
                                    disabled={member.role === "MEMBER" || isLoading}
                                  >
                                    Make Member
                                  </DropdownMenuItem>
                                  <Separator />
                                  <DropdownMenuItem
                                    onSelect={() => handleRemoveUser(member.userId)}
                                    className="text-destructive focus:text-destructive"
                                    disabled={isLoading}
                                  >
                                    <UserMinus className="mr-2 h-4 w-4" />
                                    Remove from Organization
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => openBanConfirmation(member)}
                                    className="text-destructive focus:text-destructive"
                                    disabled={isLoading}
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
                  {bannedUsers.length === 0 ? (
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
                  {/* Transfer Ownership - Placeholder */}
                  <div className="space-y-2 p-4 border border-dashed rounded-lg">
                    <h3 className="text-lg font-medium">Transfer Ownership</h3>
                    <p className="text-sm text-muted-foreground">
                      Transfer ownership of this organization to another member. This action requires careful consideration.
                    </p>
                    <Button variant="outline" disabled>Transfer Ownership (WIP)</Button>
                  </div>

                  <Separator />

                  {/* Delete Organization */}
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
                            // Basic confirmation check
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
                            disabled // Initially disabled
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
      </main> {/* Ensure main tag is closed correctly */}

      {/* Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Members</DialogTitle>
            <DialogDescription>
              Enter the email address of the user you want to invite to {organization.name}.
              (Note: Invite functionality is not fully implemented yet.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              id="invite-email"
              type="email"
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} disabled={isLoading || !inviteEmail.trim()}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send Invite (WIP)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Confirmation Dialog */}
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
