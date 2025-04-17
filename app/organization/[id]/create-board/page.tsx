"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Building2 } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"

export default function CreateBoardPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [boardName, setBoardName] = useState("")
  const [boardDescription, setBoardDescription] = useState("")
  const [boardImage, setBoardImage] = useState("/placeholder.svg?height=200&width=400")
  const [isPrivate, setIsPrivate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Mock organization data
  const organization = {
    id: Number.parseInt(params.id),
    name: "Acme Corp",
  }

  const handleCreateBoard = () => {
    if (boardName.trim()) {
      setIsLoading(true)

      // In a real app, this would be an API call to create the board
      setTimeout(() => {
        setIsLoading(false)
        // Redirect to the organization page after creating the board
        router.push(`/organization/${params.id}`)
      }, 1000)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="h-5 w-5" />
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
              <div className="space-y-2">
                <Label htmlFor="board-name">Board name *</Label>
                <Input
                  id="board-name"
                  placeholder="e.g., Feature Requests"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="board-description">Description (optional)</Label>
                <Textarea
                  id="board-description"
                  placeholder="Describe the purpose of this board"
                  value={boardDescription}
                  onChange={(e) => setBoardDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="board-image">Board image URL (optional)</Label>
                <Input
                  id="board-image"
                  placeholder="https://example.com/image.jpg"
                  value={boardImage}
                  onChange={(e) => setBoardImage(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">This image will be displayed at the top of your board.</p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch id="private-mode" checked={isPrivate} onCheckedChange={setIsPrivate} />
                <Label htmlFor="private-mode">Private board</Label>
              </div>

              {isPrivate ? (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Private Board</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Private boards are only visible to invited members. You'll need to invite people to view and post on
                    this board.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Public Board</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Public boards are visible to all members of your organization. Anyone in the organization can view
                    and post on this board.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push(`/organization/${params.id}`)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBoard} disabled={!boardName.trim() || isLoading}>
                {isLoading ? "Creating..." : "Create Board"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
