"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Building2,
  Globe,
  Lock,
  MoreHorizontal,
  Save,
  Shield,
  Upload,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

export default function OrganizationSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Mock organization data
  const [organization, setOrganization] = useState({
    id: Number.parseInt(params.id),
    name: "Acme Corp",
    description: "Company-wide feedback boards",
    image: "/placeholder.svg?height=400&width=400",
    isPrivate: false,
    members: 15,
    userRole: "admin", // admin, moderator, member
    boards: 3,
  })

  // Mock organization members
  const [members, setMembers] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
      avatar: "/placeholder.svg?height=40&width=40",
      isCurrentUser: true,
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "moderator",
      avatar: "/placeholder.svg?height=40&width=40",
      isCurrentUser: false,
    },
    {
      id: 3,
      name: "Mike Wilson",
      email: "mike@example.com",
      role: "member",
      avatar: "/placeholder.svg?height=40&width=40",
      isCurrentUser: false,
    },
    {
      id: 4,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      role: "member",
      avatar: "/placeholder.svg?height=40&width=40",
      isCurrentUser: false,
    },
  ])

  // Mock banned users
  const [bannedUsers, setBannedUsers] = useState([
    {
      id: 5,
      name: "Alex Thompson",
      email: "alex@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
      bannedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      reason: "Spam and inappropriate content",
    },
  ])

  const handleSaveSettings = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsEditing(false)
      setSuccessMessage("Organization settings updated successfully")
      setTimeout(() => setSuccessMessage(""), 3000)
    }, 1000)
  }

  const handleDeleteOrganization = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
      router.push("/dashboard")
    }, 1500)
  }

  const handleInviteUser = () => {
    if (inviteEmail.trim()) {
      // In a real app, this would send an invitation to the user
      alert(`Invitation sent to ${inviteEmail} to join the organization`)
      setInviteEmail("")
      setIsInviteDialogOpen(false)
    }
  }

  const handleChangeRole = (userId: number, newRole: string) => {
    setMembers(
      members.map((member) => {
        if (member.id === userId) {
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
    }
  }

  const handleBanUser = (userId: number) => {
    const userToBan = members.find((m) => m.id === userId)
    if (userToBan) {
      setMembers(members.filter((member) => member.id !== userId))
      setBannedUsers([
        ...bannedUsers,
        {
          ...userToBan,
          bannedAt: new Date().toISOString(),
          reason: "Banned by administrator",
        },
      ])
    }
  }

  const handleUnbanUser = (userId: number) => {
    const userToUnban = bannedUsers.find((u) => u.id === userId)
    if (userToUnban) {
      setBannedUsers(bannedUsers.filter((user) => user.id !== userId))
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/organization/${params.id}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <h1 className="text-2xl font-bold">Organization Settings</h1>
            </div>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg flex items-center gap-2 text-green-800 dark:text-green-300">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>{successMessage}</span>
            </div>
          )}

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="banned">Banned Users</TabsTrigger>
              <TabsTrigger value="danger">Danger Zone</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Organization Settings</CardTitle>
                      <CardDescription>
                        Manage your organization's basic information and privacy settings.
                      </CardDescription>
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
                          <Building2 className="mr-2 h-4 w-4" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative h-32 w-32 rounded-lg overflow-hidden">
                        <Image
                          src={organization.image || "/placeholder.svg"}
                          alt={organization.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {isEditing && (
                        <Button variant="outline" size="sm" className="gap-2">
                          <Upload className="h-4 w-4" />
                          Change Image
                        </Button>
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="org-name">Organization name</Label>
                        <Input
                          id="org-name"
                          value={organization.name}
                          onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="org-description">Description</Label>
                        <Textarea
                          id="org-description"
                          value={organization.description}
                          onChange={(e) => setOrganization({ ...organization, description: e.target.value })}
                          disabled={!isEditing}
                          rows={4}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="private-mode"
                          checked={organization.isPrivate}
                          onCheckedChange={(checked) => setOrganization({ ...organization, isPrivate: checked })}
                          disabled={!isEditing}
                        />
                        <Label htmlFor="private-mode">Private organization</Label>
                      </div>
                      {organization.isPrivate ? (
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-medium">Private Organization</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Private organizations are only visible to invited members. They won't appear in public
                            listings.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-medium">Public Organization</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Public organizations are visible to everyone. They will appear in public listings and can be
                            discovered by users.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <div className="pt-4">
                      <Button onClick={handleSaveSettings} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Organization Members</CardTitle>
                      <CardDescription>Manage members and their roles within this organization.</CardDescription>
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
                            Enter the email address of the person you want to invite to this organization.
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
                          <AlertDialogAction onClick={handleInviteUser}>Send Invitation</AlertDialogAction>
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
                              {member.isCurrentUser && (
                                <Badge variant="outline" className="text-xs">
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              member.role === "admin"
                                ? "default"
                                : member.role === "moderator"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="capitalize"
                          >
                            {member.role === "admin" && <Shield className="mr-1 h-3 w-3" />}
                            {member.role}
                          </Badge>
                          {!member.isCurrentUser && (
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
                                  Remove from Organization
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
                          )}
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
                  <CardDescription>Users who are banned from this organization.</CardDescription>
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
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  Banned on {formatDate(user.bannedAt)}
                                </span>
                                {user.reason && <span className="text-xs text-muted-foreground">• {user.reason}</span>}
                              </div>
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

            <TabsContent value="danger">
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>
                    Actions in this section can permanently delete your organization and cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Transfer Ownership</h3>
                    <p className="text-sm text-muted-foreground">
                      Transfer ownership of this organization to another member.
                    </p>
                    <Button variant="outline">Transfer Ownership</Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-destructive">Delete Organization</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this organization and all its boards. This action cannot be undone.
                    </p>
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Organization</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the organization "
                            {organization.name}" and all its boards and data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                            <div className="flex items-center gap-2">
                              <X className="h-5 w-5 text-destructive" />
                              <p className="font-medium text-destructive">Warning: This action is irreversible</p>
                            </div>
                            <p className="mt-2 text-sm">
                              All boards, posts, comments, and organization data will be permanently deleted. You will
                              not be able to recover this data.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-delete">Type "{organization.name}" to confirm</Label>
                            <Input id="confirm-delete" placeholder={organization.name} />
                          </div>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteOrganization}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isLoading ? "Deleting..." : "Delete Organization"}
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
    </div>
  )
}
