"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, BarChart3, Megaphone, Plus } from "lucide-react"
import CustomFieldRenderer from "@/components/custom-fields/custom-field-renderer"

interface CustomField {
  id: string
  label: string
  type: "text" | "number" | "select" | "checkbox" | "date"
  required: boolean
  placeholder?: string
  options?: string[]
  defaultValue?: string | number | boolean
}

interface PostCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  boardId: string
  userRole: string
}

export default function PostCreationDialog({
  open,
  onOpenChange,
  onSubmit,
  boardId,
  userRole,
}: PostCreationDialogProps) {
  const [postType, setPostType] = useState<"feedback" | "poll" | "announcement">("feedback")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""])
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({})
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // In a real app, you would fetch custom fields from your API
  useEffect(() => {
    // Simulating API call to get custom fields for this board
    const fetchCustomFields = async () => {
      // This would be an API call in a real app
      // const response = await fetch(`/api/boards/${boardId}/custom-fields`);
      // const data = await response.json();
      // setCustomFields(data);

      // For demo purposes, we'll use mock data
      setCustomFields([
        {
          id: "priority",
          label: "Priority",
          type: "select",
          required: true,
          options: ["Low", "Medium", "High", "Critical"],
        },
        {
          id: "expected_completion",
          label: "Expected Completion",
          type: "date",
          required: false,
          placeholder: "When do you expect this to be completed?",
        },
        {
          id: "affects_customers",
          label: "Affects Customers",
          type: "checkbox",
          required: false,
          placeholder: "Does this issue affect customers?",
        },
      ])
    }

    if (open) {
      fetchCustomFields()
    }
  }, [open, boardId])

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, ""])
  }

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions]
      newOptions.splice(index, 1)
      setPollOptions(newOptions)
    }
  }

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions]
    newOptions[index] = value
    setPollOptions(newOptions)
  }

  const handleCustomFieldChange = (id: string, value: any) => {
    setCustomFieldValues({
      ...customFieldValues,
      [id]: value,
    })
  }

  const handleSubmit = () => {
    if (!title.trim()) return

    setIsLoading(true)

    // Prepare the data to submit
    const postData = {
      title,
      description,
      type: postType,
      boardId,
      customFields: customFieldValues,
    }

    if (postType === "poll") {
      const validOptions = pollOptions.filter((option) => option.trim() !== "")
      if (validOptions.length < 2) {
        alert("Please add at least two poll options")
        setIsLoading(false)
        return
      }
      postData.pollOptions = validOptions
    }

    // Check if all required custom fields are filled
    const missingRequiredFields = customFields
      .filter((field) => field.required && !customFieldValues[field.id])
      .map((field) => field.label)

    if (missingRequiredFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingRequiredFields.join(", ")}`)
      setIsLoading(false)
      return
    }

    // Submit the data
    onSubmit(postData)

    // Reset form
    setTitle("")
    setDescription("")
    setPostType("feedback")
    setPollOptions(["", ""])
    setCustomFieldValues({})
    setIsLoading(false)
    onOpenChange(false)
  }

  const canCreateAnnouncement = () => {
    return userRole === "admin" || userRole === "moderator"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create a new post</DialogTitle>
          <DialogDescription>Share your feedback, ideas, or create a poll.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Post type</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={postType === "feedback" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPostType("feedback")}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Feedback
              </Button>
              <Button
                variant={postType === "poll" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPostType("poll")}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Poll
              </Button>
              {canCreateAnnouncement() && (
                <Button
                  variant={postType === "announcement" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setPostType("announcement")}
                >
                  <Megaphone className="mr-2 h-4 w-4" />
                  Announcement
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
              placeholder={
                postType === "feedback"
                  ? "e.g., Add dark mode support"
                  : postType === "poll"
                    ? "e.g., Which feature should we build next?"
                    : "e.g., Important: Upcoming maintenance"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-description">Description</Label>
            <Textarea
              id="post-description"
              placeholder={
                postType === "feedback"
                  ? "Provide more details about your idea..."
                  : postType === "poll"
                    ? "Explain what you're asking about..."
                    : "Share important information with the community..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {postType === "poll" && (
            <div className="space-y-3">
              <Label>Poll options</Label>
              {pollOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handlePollOptionChange(index, e.target.value)}
                  />
                  {pollOptions.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePollOption(index)}
                      className="shrink-0"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddPollOption}>
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            </div>
          )}

          {/* Custom Fields Section */}
          {customFields.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center">
                <div className="h-px flex-1 bg-border"></div>
                <span className="px-2 text-sm text-muted-foreground">Additional Information</span>
                <div className="h-px flex-1 bg-border"></div>
              </div>

              <CustomFieldRenderer
                fields={customFields}
                values={customFieldValues}
                onChange={handleCustomFieldChange}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || isLoading}>
            {isLoading ? "Creating..." : "Create Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
