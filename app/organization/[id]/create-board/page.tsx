"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Building2, Loader2 } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
interface Organization {
  id: string;
  name: string;
}

interface CreateBoardPageProps {
  params: { id: string };
  organization: Organization | null;
}

export default function CreateBoardPage({ params, organization }: CreateBoardPageProps) {
  const router = useRouter()
  const [boardName, setBoardName] = useState("")
  const [boardDescription, setBoardDescription] = useState("")
  const [boardImage, setBoardImage] = useState("/placeholder.svg?height=200&width=400")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organization) {
      console.error("Organization not found, redirecting...");
      router.push('/dashboard');
    }
  }, [organization, router]);

  const handleCreateBoard = async () => {
    if (boardName.trim() && organization) {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/organization/${organization.id}/boards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: boardName,
            description: boardDescription,
            image: boardImage,
            isPrivate: isPrivate,
            organizationId: organization.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create board');
        }

        router.push(`/organization/${params.id}`)
        router.refresh()

      } catch (err: any) {
        console.error("Error creating board:", err);
        setError(err.message || "An unexpected error occurred.");
        setIsLoading(false);
      }
    }
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-muted-foreground">Loading organization...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="h-5 w-5" />
            {/* Use fetched organization name */}
            <h2 className="text-lg font-medium">{organization.name} / Create New Board</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create a new board</CardTitle>
              <CardDescription>
                Boards are where your team can post and discuss feedback, ideas, and bug reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Board Name Input */}
              <div className="space-y-2">
                <Label htmlFor="board-name">Board name *</Label>
                <Input
                  id="board-name"
                  placeholder="e.g., Feature Requests"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Board Description Input */}
              <div className="space-y-2">
                <Label htmlFor="board-description">Description (optional)</Label>
                <Textarea
                  id="board-description"
                  placeholder="Describe the purpose of this board"
                  value={boardDescription}
                  onChange={(e) => setBoardDescription(e.target.value)}
                  rows={4}
                  disabled={isLoading}
                />
              </div>

              {/* Board Image Input */}
              <div className="space-y-2">
                <Label htmlFor="board-image">Board image URL (optional)</Label>
                <Input
                  id="board-image"
                  placeholder="https://example.com/image.jpg"
                  value={boardImage}
                  onChange={(e) => setBoardImage(e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">This image will be displayed at the top of your board.</p>
              </div>

              {/* Privacy Switch */}
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="private-mode" checked={isPrivate} onCheckedChange={setIsPrivate} disabled={isLoading} />
                <Label htmlFor="private-mode">Private board</Label>
              </div>

              {/* Privacy Description */}
              {isPrivate ? (
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <h4 className="font-medium mb-1 text-sm">Private Board</h4>
                  <p className="text-sm text-muted-foreground">
                    Private boards are only visible to invited members. You'll need to invite people to view and post.
                  </p>
                </div>
              ) : (
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <h4 className="font-medium mb-1 text-sm">Public Board</h4>
                  <p className="text-sm text-muted-foreground">
                    Public boards are visible to all members of your organization. Anyone in the organization can view and post.
                  </p>
                </div>
              )}
              {/* Display Error Message */}
              {error && (
                <p className="text-sm text-destructive">Error: {error}</p>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push(`/organization/${params.id}`)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleCreateBoard} disabled={!boardName.trim() || isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {/* Add loader to button */}
                {isLoading ? "Creating..." : "Create Board"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}


