"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Filter, MessageSquare, User } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"

interface RoadmapItem {
  id: number
  title: string
  description: string
  status: string
  priority: string
  votes: number
  comments: number
  assignee?: {
    name: string
    avatar: string
  }
  startDate?: string
  endDate?: string
  progress?: number
}

export default function RoadmapPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [view, setView] = useState<"quarters" | "months" | "weeks">("quarters")
  const [filter, setFilter] = useState<"all" | "planned" | "in-progress" | "completed">("all")
  const [currentPeriod, setCurrentPeriod] = useState(new Date())
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([])

  // In a real app, you would fetch this data from your API
  useEffect(() => {
    // Mock data for demonstration
    const mockRoadmapItems: RoadmapItem[] = [
      {
        id: 1,
        title: "Add dark mode support",
        description: "Implement dark mode across the entire application",
        status: "in-progress",
        priority: "high",
        votes: 24,
        comments: 8,
        assignee: {
          name: "Jane Smith",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        startDate: "2023-04-15",
        endDate: "2023-05-30",
        progress: 60,
      },
      {
        id: 2,
        title: "Mobile responsive design",
        description: "Ensure the application works well on all mobile devices",
        status: "planned",
        priority: "high",
        votes: 18,
        comments: 5,
        startDate: "2023-06-01",
        endDate: "2023-07-15",
      },
      {
        id: 3,
        title: "User profile customization",
        description: "Allow users to customize their profiles with avatars and bios",
        status: "planned",
        priority: "medium",
        votes: 12,
        comments: 3,
        startDate: "2023-07-01",
        endDate: "2023-08-15",
      },
      {
        id: 4,
        title: "API documentation",
        description: "Create comprehensive API documentation for developers",
        status: "completed",
        priority: "medium",
        votes: 9,
        comments: 2,
        assignee: {
          name: "John Doe",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        startDate: "2023-03-01",
        endDate: "2023-04-10",
        progress: 100,
      },
      {
        id: 5,
        title: "Performance optimization",
        description: "Improve application loading speed and overall performance",
        status: "in-progress",
        priority: "high",
        votes: 15,
        comments: 4,
        assignee: {
          name: "Mike Wilson",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        startDate: "2023-04-20",
        endDate: "2023-06-10",
        progress: 40,
      },
      {
        id: 6,
        title: "Notification system",
        description: "Implement real-time notifications for user interactions",
        status: "planned",
        priority: "high",
        votes: 20,
        comments: 7,
        startDate: "2023-06-15",
        endDate: "2023-08-01",
      },
    ]

    setRoadmapItems(mockRoadmapItems)
  }, [])

  const filteredItems = roadmapItems.filter((item) => {
    if (filter === "all") return true
    return item.status === filter
  })

  const getQuarterRange = (date: Date) => {
    const year = date.getFullYear()
    const quarter = Math.floor(date.getMonth() / 3)
    const startMonth = quarter * 3
    const endMonth = startMonth + 2

    return {
      start: new Date(year, startMonth, 1),
      end: new Date(year, endMonth + 1, 0),
      label: `Q${quarter + 1} ${year}`,
    }
  }

  const getMonthRange = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()

    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0),
      label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    }
  }

  const getWeekRange = (date: Date) => {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
    const start = new Date(date)
    start.setDate(diff)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    return {
      start,
      end,
      label: `Week of ${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    }
  }

  const getCurrentRange = () => {
    switch (view) {
      case "quarters":
        return getQuarterRange(currentPeriod)
      case "months":
        return getMonthRange(currentPeriod)
      case "weeks":
        return getWeekRange(currentPeriod)
    }
  }

  const range = getCurrentRange()

  const navigatePrevious = () => {
    const newDate = new Date(currentPeriod)
    switch (view) {
      case "quarters":
        newDate.setMonth(newDate.getMonth() - 3)
        break
      case "months":
        newDate.setMonth(newDate.getMonth() - 1)
        break
      case "weeks":
        newDate.setDate(newDate.getDate() - 7)
        break
    }
    setCurrentPeriod(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentPeriod)
    switch (view) {
      case "quarters":
        newDate.setMonth(newDate.getMonth() + 3)
        break
      case "months":
        newDate.setMonth(newDate.getMonth() + 1)
        break
      case "weeks":
        newDate.setDate(newDate.getDate() + 7)
        break
    }
    setCurrentPeriod(newDate)
  }

  const isItemInRange = (item: RoadmapItem) => {
    if (!item.startDate) return false

    const itemStart = new Date(item.startDate)
    const itemEnd = item.endDate ? new Date(item.endDate) : itemStart

    return itemStart <= range.end && itemEnd >= range.start
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "medium":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/board/${params.id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Product Roadmap</h1>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{range.label}</span>
            </div>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-[300px]">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="quarters">Quarters</TabsTrigger>
                <TabsTrigger value="months">Months</TabsTrigger>
                <TabsTrigger value="weeks">Weeks</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {filteredItems.filter(isItemInRange).length === 0 ? (
            <div className="text-center p-12 border border-dashed rounded-lg">
              <h3 className="text-lg font-medium mb-2">No roadmap items for this period</h3>
              <p className="text-muted-foreground">Try changing the time period or filter to see more items.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredItems.filter(isItemInRange).map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/4 p-4 border-b md:border-b-0 md:border-r">
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <h3 className="font-medium text-lg mb-1">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge className={getStatusColor(item.status)}>{item.status.replace("-", " ")}</Badge>
                            <Badge className={getPriorityColor(item.priority)}>{item.priority} priority</Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{item.comments}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{item.votes} votes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-3/4 p-4">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {item.startDate && new Date(item.startDate).toLocaleDateString()} -
                              {item.endDate && new Date(item.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          {item.assignee && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Assigned to:</span>
                              <div className="flex items-center gap-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={item.assignee.avatar || "/placeholder.svg"}
                                    alt={item.assignee.name}
                                  />
                                  <AvatarFallback>{item.assignee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{item.assignee.name}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {item.progress !== undefined && (
                          <div className="mt-auto">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">Progress</span>
                              <span className="text-sm text-muted-foreground">{item.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div
                                className="bg-primary h-2.5 rounded-full"
                                style={{ width: `${item.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
