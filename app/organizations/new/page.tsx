"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2, Building2 } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
import { toast } from "sonner" // Assuming you use sonner for toasts

export default function CreateOrganizationPage() {
  const router = useRouter()
  const [orgName, setOrgName] = useState("")
  const [orgDescription, setOrgDescription] = useState("")
  const [orgImageUrl, setOrgImageUrl] = useState("") // Optional image URL
  const [isPrivate, setIsPrivate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      setError("Organization name is required.");
      toast.error("Organization name is required.");
      return;
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/organizations', { // API endpoint to create org
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          description: orgDescription,
          imageUrl: orgImageUrl || null, // Send null if empty
          isPrivate: isPrivate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create organization');
      }

      toast.success(`Organization "${data.name}" created successfully!`);
      // Redirect to the newly created organization's page
      router.push(`/organization/${data.id}`);
      router.refresh(); // Refresh server components

    } catch (err: any) {
      console.error("Error creating organization:", err);
      setError(err.message || "An unexpected error occurred.");
      toast.error("Error creating organization", { description: err.message });
      setIsLoading(false); // Stop loading on error
    }
    // No finally block needed here, loading stops on error or success redirect
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6" /> Create New Organization
              </CardTitle>
              <CardDescription>
                Set up a new organization to manage boards and collaborate with your team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="my-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name *</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., Acme Inc., My Project Team"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-description">Description</Label>
                <Textarea
                  id="org-description"
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="What is this organization about?"
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="org-image-url">Logo URL (Optional)</Label>
                <Input
                  id="org-image-url"
                  value={orgImageUrl}
                  onChange={(e) => setOrgImageUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                 <p className="text-xs text-muted-foreground">
                    Link to an image for your organization's logo.
                 </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="private-mode"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
                <Label htmlFor="private-mode">Private Organization</Label>
              </div>
              {isPrivate && (
                <p className="text-sm text-muted-foreground">
                  Private organizations and their boards are only visible to invited members.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
               <Button variant="outline" onClick={() => router.back()} disabled={isLoading}>
                 Cancel
               </Button>
              <Button onClick={handleCreateOrganization} disabled={isLoading || !orgName.trim()}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? "Creating..." : "Create Organization"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
