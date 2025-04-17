"use client"

import { Badge } from "@/components/ui/badge"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
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
  User,
  Mail,
  Lock,
  Bell,
  Github,
  Upload,
  LogOut,
  CheckCircle,
  XCircle,
  AlertCircle,
  Globe,
  Twitter,
  Linkedin,
} from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"

export default function AccountSettingsPage() {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // User profile state
  const [profile, setProfile] = useState({
    username: "johndoe",
    displayName: "John Doe",
    email: "john.doe@example.com",
    bio: "Product manager and UX enthusiast. I love building tools that help teams collaborate better.",
    avatar: "/placeholder.svg?height=128&width=128",
    website: "https://johndoe.com",
    twitter: "johndoe",
    linkedin: "johndoe",
    github: "johndoe",
  })

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    mentionNotifications: true,
    replyNotifications: true,
    voteNotifications: false,
    commentNotifications: true,
    statusChangeNotifications: true,
    digestEmail: "weekly", // daily, weekly, never
  })

  // Connected accounts state
  const [connectedAccounts, setConnectedAccounts] = useState({
    github: true,
    google: false,
    twitter: false,
  })

  const handleProfileUpdate = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setSuccessMessage("Profile updated successfully")
      setTimeout(() => setSuccessMessage(""), 3000)
    }, 1000)
  }

  const handlePasswordChange = () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match")
      return
    }

    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setIsPasswordDialogOpen(false)
      setSuccessMessage("Password changed successfully")
      setTimeout(() => setSuccessMessage(""), 3000)
    }, 1000)
  }

  const handleDeleteAccount = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
      router.push("/")
    }, 1500)
  }

  const handleConnectAccount = (account: string) => {
    setConnectedAccounts({
      ...connectedAccounts,
      [account]: true,
    })
  }

  const handleDisconnectAccount = (account: string) => {
    setConnectedAccounts({
      ...connectedAccounts,
      [account]: false,
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg flex items-center gap-2 text-green-800 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span>{successMessage}</span>
            </div>
          )}

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                <span className="hidden sm:inline">Connections</span>
              </TabsTrigger>
              <TabsTrigger value="danger" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Danger Zone</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your profile information. This information will be displayed publicly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="h-32 w-32">
                        <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.displayName} />
                        <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Change Avatar
                      </Button>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={profile.username}
                            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Your unique username for Project Vision. Used in URLs and mentions.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="displayName">Display Name</Label>
                          <Input
                            id="displayName"
                            value={profile.displayName}
                            onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Your name displayed to other users across the platform.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Your email address is used for notifications and account recovery.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <textarea
                          id="bio"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={profile.bio}
                          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Tell others a little about yourself. This will be displayed on your profile.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Social Links</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="website" className="flex items-center gap-2">
                          <Globe className="h-4 w-4" /> Website
                        </Label>
                        <Input
                          id="website"
                          value={profile.website}
                          onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twitter" className="flex items-center gap-2">
                          <Twitter className="h-4 w-4" /> Twitter
                        </Label>
                        <Input
                          id="twitter"
                          value={profile.twitter}
                          onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                          placeholder="username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin" className="flex items-center gap-2">
                          <Linkedin className="h-4 w-4" /> LinkedIn
                        </Label>
                        <Input
                          id="linkedin"
                          value={profile.linkedin}
                          onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                          placeholder="username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="github" className="flex items-center gap-2">
                          <Github className="h-4 w-4" /> GitHub
                        </Label>
                        <Input
                          id="github"
                          value={profile.github}
                          onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                          placeholder="username"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleProfileUpdate} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>Manage your account security settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Password</h3>
                    <p className="text-sm text-muted-foreground">Change your password to keep your account secure.</p>
                    <AlertDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline">Change Password</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Change Password</AlertDialogTitle>
                          <AlertDialogDescription>
                            Enter your current password and a new password to update your account security.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                              id="current-password"
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                              id="new-password"
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input
                              id="confirm-password"
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            />
                          </div>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handlePasswordChange} disabled={isLoading}>
                            {isLoading ? "Updating..." : "Update Password"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account by enabling two-factor authentication.
                    </p>
                    <Button variant="outline">Set Up 2FA</Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Sessions</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your active sessions and sign out from other devices.
                    </p>
                    <div className="space-y-4 mt-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Current Session</p>
                            <p className="text-sm text-muted-foreground">Chrome on Windows • Last active now</p>
                          </div>
                          <Badge>Current</Badge>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Mobile App</p>
                            <p className="text-sm text-muted-foreground">iPhone 13 • Last active 2 hours ago</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="mt-2">
                      Sign Out All Other Sessions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Control how and when you receive notifications from Project Vision.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Email Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-notifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive email notifications for important updates.
                          </p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="digest-email">Email Digest Frequency</Label>
                        <select
                          id="digest-email"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={notificationSettings.digestEmail}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              digestEmail: e.target.value,
                            })
                          }
                          disabled={!notificationSettings.emailNotifications}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="never">Never</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                          How often you want to receive email summaries of activity.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">In-App Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="mention-notifications">Mentions</Label>
                          <p className="text-sm text-muted-foreground">
                            When someone mentions you in a comment or post.
                          </p>
                        </div>
                        <Switch
                          id="mention-notifications"
                          checked={notificationSettings.mentionNotifications}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, mentionNotifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="reply-notifications">Replies</Label>
                          <p className="text-sm text-muted-foreground">When someone replies to your comment or post.</p>
                        </div>
                        <Switch
                          id="reply-notifications"
                          checked={notificationSettings.replyNotifications}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, replyNotifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="vote-notifications">Votes</Label>
                          <p className="text-sm text-muted-foreground">When someone upvotes or downvotes your post.</p>
                        </div>
                        <Switch
                          id="vote-notifications"
                          checked={notificationSettings.voteNotifications}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, voteNotifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="comment-notifications">Comments</Label>
                          <p className="text-sm text-muted-foreground">
                            When someone comments on a post you're following.
                          </p>
                        </div>
                        <Switch
                          id="comment-notifications"
                          checked={notificationSettings.commentNotifications}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, commentNotifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="status-notifications">Status Changes</Label>
                          <p className="text-sm text-muted-foreground">
                            When the status of a post you created or follow changes.
                          </p>
                        </div>
                        <Switch
                          id="status-notifications"
                          checked={notificationSettings.statusChangeNotifications}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              statusChangeNotifications: checked,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleProfileUpdate} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Preferences"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="connections">
              <Card>
                <CardHeader>
                  <CardTitle>Connected Accounts</CardTitle>
                  <CardDescription>
                    Connect your accounts to enable single sign-on and additional features.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                          <Github className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-medium">GitHub</h4>
                          <p className="text-sm text-muted-foreground">
                            Connect to GitHub to sync issues and repositories.
                          </p>
                        </div>
                      </div>
                      {connectedAccounts.github ? (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="gap-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Connected
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => handleDisconnectAccount("github")}>
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={() => handleConnectAccount("github")}>Connect</Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                          <Mail className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-medium">Google</h4>
                          <p className="text-sm text-muted-foreground">
                            Connect to Google for single sign-on and calendar integration.
                          </p>
                        </div>
                      </div>
                      {connectedAccounts.google ? (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="gap-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Connected
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => handleDisconnectAccount("google")}>
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={() => handleConnectAccount("google")}>Connect</Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                          <Twitter className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-medium">Twitter</h4>
                          <p className="text-sm text-muted-foreground">
                            Connect to Twitter to share feedback and updates.
                          </p>
                        </div>
                      </div>
                      {connectedAccounts.twitter ? (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="gap-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Connected
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => handleDisconnectAccount("twitter")}>
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={() => handleConnectAccount("twitter")}>Connect</Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">API Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your API keys and access tokens for integrating with Project Vision.
                    </p>
                    <Button variant="outline">Manage API Keys</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="danger">
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>
                    Actions in this section can permanently delete your data and cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Export Your Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Download a copy of all your data from Project Vision.
                    </p>
                    <Button variant="outline">Export Data</Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-destructive">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Account</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove all your
                            data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-5 w-5 text-destructive" />
                              <p className="font-medium text-destructive">Warning: This action is irreversible</p>
                            </div>
                            <p className="mt-2 text-sm">
                              All your posts, comments, boards, and personal information will be permanently deleted.
                              You will not be able to recover this data.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-delete">Type "DELETE" to confirm</Label>
                            <Input id="confirm-delete" placeholder="DELETE" />
                          </div>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isLoading ? "Deleting..." : "Delete Account"}
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
