"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, User, Globe, Building2, Search, Users } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Mock public organizations
  const publicOrganizations = [
    {
      id: 1,
      name: "Acme Corp",
      description: "Company-wide feedback boards",
      image: "/placeholder.svg?height=200&width=200",
      members: 15,
      boards: 3,
    },
    {
      id: 2,
      name: "Design Community",
      description: "A community for designers to share feedback and ideas",
      image: "/placeholder.svg?height=200&width=200",
      members: 42,
      boards: 5,
    },
    {
      id: 3,
      name: "Developer Hub",
      description: "Open source project feedback and feature requests",
      image: "/placeholder.svg?height=200&width=200",
      members: 78,
      boards: 8,
    },
    {
      id: 4,
      name: "Product Managers",
      description: "Discuss product management best practices and tools",
      image: "/placeholder.svg?height=200&width=200",
      members: 36,
      boards: 4,
    },
  ]

  // Mock public boards
  const publicBoards = [
    {
      id: 1,
      name: "Feature Requests",
      description: "Collect and prioritize feature ideas from users",
      image: "/placeholder.svg?height=200&width=400",
      organization: "Acme Corp",
      posts: 24,
      members: 12,
    },
    {
      id: 2,
      name: "Design Feedback",
      description: "Feedback on UI/UX designs",
      image: "/placeholder.svg?height=200&width=400",
      organization: "Design Community",
      posts: 18,
      members: 8,
    },
    {
      id: 3,
      name: "Bug Reports",
      description: "Track and manage bug reports from users",
      image: "/placeholder.svg?height=200&width=400",
      organization: "Developer Hub",
      posts: 32,
      members: 10,
    },
    {
      id: 4,
      name: "Product Roadmap",
      description: "Long-term product planning and roadmap",
      image: "/placeholder.svg?height=200&width=400",
      organization: "Product Managers",
      posts: 15,
      members: 7,
    },
  ]

  // Filter organizations and boards based on search query
  const filteredOrganizations = publicOrganizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredBoards = publicBoards.filter(
    (board) =>
      board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      board.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      board.organization.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Discover</h1>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations and boards..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="organizations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="organizations">Public Organizations</TabsTrigger>
            <TabsTrigger value="boards">Public Boards</TabsTrigger>
          </TabsList>

          <TabsContent value="organizations">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrganizations.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No organizations found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or browse all public organizations.</p>
                </div>
              ) : (
                filteredOrganizations.map((org) => (
                  <Link key={org.id} href={`/organization/${org.id}`}>
                    <Card className="h-full hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      <CardHeader className="flex flex-row items-center gap-4">
                        <div className="relative h-16 w-16 rounded-lg overflow-hidden">
                          <Image src={org.image || "/placeholder.svg"} alt={org.name} fill className="object-cover" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {org.name}
                            <Badge variant="outline" className="gap-1">
                              <Globe className="h-3 w-3" />
                              Public
                            </Badge>
                          </CardTitle>
                          <CardDescription>{org.description}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{org.members} members</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{org.boards} boards</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" className="w-full">
                          View Organization
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="boards">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBoards.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No boards found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or browse all public boards.</p>
                </div>
              ) : (
                filteredBoards.map((board) => (
                  <Link key={board.id} href={`/board/${board.id}`}>
                    <Card className="h-full hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors overflow-hidden">
                      <div className="relative h-40 w-full">
                        <Image src={board.image || "/placeholder.svg"} alt={board.name} fill className="object-cover" />
                      </div>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{board.name}</CardTitle>
                          <Badge variant="outline" className="gap-1">
                            <Globe className="h-3 w-3" />
                            Public
                          </Badge>
                        </div>
                        <CardDescription>{board.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{board.posts} posts</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{board.members} members</span>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <Link
                              href={`/organization/${publicOrganizations.find((o) => o.name === board.organization)?.id}`}
                              className="hover:underline"
                            >
                              {board.organization}
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" className="w-full">
                          View Board
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
