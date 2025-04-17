"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Tag, Trash2, MoveVertical, Archive, Clock } from "lucide-react"

interface Post {
  id: number
  title: string
  type: string
  status: string
}

interface BulkActionsToolbarProps {
  posts: Post[]
  selectedPosts: number[]
  onSelectAll: () => void
  onDeselectAll: () => void
  onSelectPost: (id: number) => void
  onChangeStatus: (ids: number[], status: string) => void
  onDelete: (ids: number[]) => void
  onArchive: (ids: number[]) => void
  onMove: (ids: number[], boardId: number) => void
  onAddTag: (ids: number[], tag: string) => void
}

export default function BulkActionsToolbar({
  posts,
  selectedPosts,
  onSelectAll,
  onDeselectAll,
  onSelectPost,
  onChangeStatus,
  onDelete,
  onArchive,
  onMove,
  onAddTag,
}: BulkActionsToolbarProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false)

  const allSelected = posts.length > 0 && selectedPosts.length === posts.length
  const someSelected = selectedPosts.length > 0 && selectedPosts.length < posts.length

  const handleSelectAllChange = () => {
    if (allSelected) {
      onDeselectAll()
    } else {
      onSelectAll()
    }
  }

  const handleDelete = () => {
    onDelete(selectedPosts)
    setIsDeleteDialogOpen(false)
  }

  const handleArchive = () => {
    onArchive(selectedPosts)
    setIsArchiveDialogOpen(false)
  }

  if (selectedPosts.length === 0) {
    return null
  }

  return (
    <div className="sticky top-16 z-10 bg-background border-b py-2 px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Checkbox
          id="select-all"
          checked={allSelected}
          indeterminate={someSelected}
          onCheckedChange={handleSelectAllChange}
        />
        <label htmlFor="select-all" className="text-sm font-medium">
          {selectedPosts.length} selected
        </label>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Clock className="mr-2 h-4 w-4" />
              Change Status
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Set Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChangeStatus(selectedPosts, "planned")}>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 mr-2">Planned</Badge>
              <span>Planned</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeStatus(selectedPosts, "in-progress")}>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 mr-2">
                In Progress
              </Badge>
              <span>In Progress</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeStatus(selectedPosts, "completed")}>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 mr-2">
                Completed
              </Badge>
              <span>Completed</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Tag className="mr-2 h-4 w-4" />
              Add Tag
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Add Tag</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAddTag(selectedPosts, "bug")}>Bug</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddTag(selectedPosts, "feature")}>Feature</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddTag(selectedPosts, "enhancement")}>Enhancement</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddTag(selectedPosts, "documentation")}>Documentation</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Create New Tag...</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoveVertical className="mr-2 h-4 w-4" />
              Move To
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Select Board</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onMove(selectedPosts, 1)}>Feature Requests</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove(selectedPosts, 2)}>Bug Reports</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove(selectedPosts, 3)}>Product Roadmap</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsArchiveDialogOpen(true)}
          className="text-amber-600 dark:text-amber-400"
        >
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </Button>

        <Button variant="outline" size="sm" onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>

        <Button variant="ghost" size="sm" onClick={onDeselectAll}>
          Cancel
        </Button>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {selectedPosts.length} selected{" "}
              {selectedPosts.length === 1 ? "post" : "posts"}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Archive {selectedPosts.length} {selectedPosts.length === 1 ? "post" : "posts"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Archived posts will be hidden from the main view but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
