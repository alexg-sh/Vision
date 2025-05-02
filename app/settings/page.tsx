"use client"

import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react" // Destructure update function below
import { useEffect, useState, useRef } from "react"
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
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

async function logAuditAction(logData: Omit<AuditLogProps, 'userId'>) {
  try {
    const response = await fetch('/api/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to create audit log:", errorData.message);
    }
  } catch (error) {
    console.error("Error calling audit log API:", error);
  }
}

interface UserSession {
  id: string;
  sessionToken: string;
  userId: string;
  expires: string;
  isCurrent: boolean;
  deviceInfo: string;
  lastActive: string;
}

interface AuditLogProps {
  orgId?: string;
  boardId?: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  details?: Record<string, any>;
}

export default function AccountSettingsPage() {
  const { data: session, status, update } = useSession() // get update()
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [passwordError, setPasswordError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionError, setSessionError] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [profile, setProfile] = useState({
    username: "",
    displayName: "",
    email: "",
    bio: "",
    avatar: "",
    website: "",
    twitter: "",
    linkedin: "",
    github: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    mentionNotifications: true,
    replyNotifications: true,
    voteNotifications: false,
    commentNotifications: true,
    statusChangeNotifications: true,
    digestEmail: "weekly",
  })

  const [connectedAccounts, setConnectedAccounts] = useState({
    github: true,
    google: false,
    twitter: false,
  })

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      setIsLoading(true)
      fetch(`/api/user/profile?userId=${session.user.id}`)
        .then(async res => {
          if (!res.ok) {
            const errorText = await res.text();
            console.error('Error fetching profile: Status', res.status, 'Response:', errorText);
            throw new Error(`Failed to fetch profile (status ${res.status})`);
          }
          return res.json()
        })
        .then(data => {
          setProfile({
            username: data.username ?? "",
            displayName: data.name ?? "",
            email: data.email ?? "",
            bio: data.bio ?? "",
            avatar: data.image ?? "/placeholder.svg?height=128&width=128",
            website: data.website ?? "",
            twitter: data.twitter ?? "",
            linkedin: data.linkedin ?? "",
            github: data.github ?? "",
          })
        })
        .catch(error => {
          console.error("Error processing user profile data:", error)
        })
        .finally(() => setIsLoading(false))

      fetchUserSessions();

    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [session, status, router])

  const fetchUserSessions = async () => {
    setSessionError("");
    try {
      const response = await fetch('/api/user/sessions');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch sessions');
      }
      const data: UserSession[] = await response.json();
      setSessions(data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      if (error instanceof Error) {
        setSessionError(error.message);
      } else {
        setSessionError("An unknown error occurred while fetching sessions.");
      }
    }
  };

  const handleProfileUpdate = async () => {
    if (!session?.user?.id) return;
    setIsLoading(true);
    setProfileError(null); // Clear previous errors
    setSuccessMessage(""); // Clear previous success messages
    try {
      const response = await fetch(`/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, ...profile })
      });

      if (!response.ok) {
        let errorMsg = 'Failed to update profile';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg; // Use specific error from API if available
        } catch (parseError) {
          // If response is not JSON or empty, use the default message
          console.error("Could not parse error response:", parseError);
        }
        throw new Error(errorMsg);
      }

      const updatedData = await response.json();
      setSuccessMessage("Profile updated successfully");

      // If username changed, update the session so navbar link updates
      if (updatedData.username && session?.user) {
        await update({ user: { ...session.user, username: updatedData.username } });
      }

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof Error) {
        setProfileError(error.message);
      } else {
        setProfileError("An unknown error occurred while updating the profile.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handlePasswordChange = async () => {
    setPasswordError("");
    setSuccessMessage("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
        setPasswordError("New password must be at least 6 characters long");
        return;
    }
    if (!passwordData.currentPassword) {
        setPasswordError("Current password is required");
        return;
    }


    setIsLoading(true);
    try {
        const response = await fetch('/api/user/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to change password');
        }

        setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
        setIsPasswordDialogOpen(false);
        setSuccessMessage("Password changed successfully");
        setTimeout(() => setSuccessMessage(""), 3000);

    } catch (error) {
        console.error("Error changing password:", error);
        if (error instanceof Error) {
            setPasswordError(error.message);
        } else {
            setPasswordError("An unknown error occurred.");
        }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError("");
    setSuccessMessage("");
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAvatarError("Please select an image file.");
      return;
    }
    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setAvatarError("File size should not exceed 5MB.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload avatar');
      }

      setProfile({ ...profile, avatar: result.avatarUrl });
      setSuccessMessage("Avatar updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (error) {
      console.error("Error uploading avatar:", error);
      if (error instanceof Error) {
        setAvatarError(error.message);
      } else {
        setAvatarError("An unknown error occurred during upload.");
      }
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSignOutSession = async (sessionId: string) => {
    setIsLoading(true);
    setSessionError("");
    try {
      const response = await fetch(`/api/user/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sign out session');
      }
      await fetchUserSessions();
      setSuccessMessage("Session signed out successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error signing out session:", error);
      if (error instanceof Error) {
        setSessionError(error.message);
      } else {
        setSessionError("An unknown error occurred while signing out the session.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOutAllOtherSessions = async () => {
    setIsLoading(true);
    setSessionError("");
    try {
      const response = await fetch(`/api/user/sessions?deleteAllOthers=true`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sign out other sessions');
      }
      await fetchUserSessions();
      setSuccessMessage("Signed out from all other sessions successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error signing out other sessions:", error);
      if (error instanceof Error) {
        setSessionError(error.message);
      } else {
        setSessionError("An unknown error occurred while signing out other sessions.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationSettingsUpdate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: notificationSettings }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        console.error("Failed to update notification settings:", errorData.message);
        throw new Error('Failed to update notification settings');
      }

      toast.success("Notification settings updated.");
    } catch (err: any) {
      console.error("Error in handleNotificationSettingsUpdate:", err);
      setError(err.message || "An unexpected error occurred.");
      toast.error("Error: " + (err.message || "Could not update settings."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    setIsLoading(true)
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

  const formatSessionTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid date";
    }
  };

  if (status === "loading" || isLoading) {
    return <div>Loading...</div>
  }

  return (
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
                {/* Display Profile Error Message */}
                {profileError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    <span>{profileError}</span>
                  </div>
                )}
                {avatarError && (
                    <div className="my-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                        {avatarError}
                    </div>
                )}
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.displayName} />
                      <AvatarFallback>{profile.displayName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    {/* Button triggers the hidden file input */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <Upload className="h-4 w-4" />
                      {isLoading ? "Uploading..." : "Change Avatar"}
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
                      {passwordError && (
                          <div className="my-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                              {passwordError}
                          </div>
                      )}
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
                  {sessionError && (
                      <div className="my-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                          {sessionError}
                      </div>
                  )}
                  <div className="space-y-4 mt-4">
                    {sessions.length > 0 ? (
                      sessions.map((s) => (
                        <div key={s.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">
                                {s.deviceInfo} {s.isCurrent && "(Current Session)"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Last active {formatSessionTime(s.lastActive)}
                              </p>
                            </div>
                            {s.isCurrent ? (
                              <Badge>Current</Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSignOutSession(s.id)}
                                disabled={isLoading}
                              >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No active sessions found.</p>
                    )}
                  </div>
                  {sessions.filter(s => !s.isCurrent).length > 0 && (
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={handleSignOutAllOtherSessions}
                      disabled={isLoading}
                    >
                      Sign Out All Other Sessions
                    </Button>
                  )}
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
                <Button onClick={handleNotificationSettingsUpdate} disabled={isLoading}>
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
                  {/* GitHub Connection Block - Corrected Structure */}
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

                  {/* Google Connection Block - Corrected Structure */}
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

                  {/* Twitter Connection Block - Corrected Structure */}
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

                {/* Delete Account Section - Corrected Structure */}
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
  )
}
