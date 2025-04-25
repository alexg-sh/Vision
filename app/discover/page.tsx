"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, User, Globe, Building2, Search, Users, Loader2 } from "lucide-react"

interface PublicOrganization {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  createdAt: string
  _count: {
    members: number
    boards: number
  }
}

interface PublicBoard {
  id: string
  name: string
  description: string | null
  createdAt: string
  organization?: {
    id: string
    name: string
    slug: string
    imageUrl: string | null
  } | null // personal boards have no org
}

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [organizations, setOrganizations] = useState<PublicOrganization[]>([])
  const [boards, setBoards] = useState<PublicBoard[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [loadingBoards, setLoadingBoards] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoadingOrgs(true)
      setLoadingBoards(true)
      try {
        const [orgResponse, boardResponse] = await Promise.all([
          fetch("/api/discover/organizations"),
          fetch("/api/discover/boards"),
        ])

        if (orgResponse.ok) {
          const orgData: PublicOrganization[] = await orgResponse.json()
          setOrganizations(orgData)
        } else {
          console.error("Failed to fetch organizations")
        }

        if (boardResponse.ok) {
          const boardData: PublicBoard[] = await boardResponse.json()
          setBoards(boardData)
        } else {
          console.error("Failed to fetch boards")
        }
      } catch (error) {
        console.error("Error fetching discover data:", error)
      } finally {
        setLoadingOrgs(false)
        setLoadingBoards(false)
      }
    }
    fetchData()
  }, [])

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (org.description && org.description.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const filteredBoards = boards.filter(
    (board) =>
      board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (board.description && board.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (board.organization?.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const renderLoading = () => (
    <div className="col-span-full flex justify-center items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="ml-2 text-muted-foreground">Loading...</span>
    </div>
  )

  return (
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
            {loadingOrgs ? (
              renderLoading()
            ) : filteredOrganizations.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No organizations found</h3>
                <p className="text-muted-foreground">Try adjusting your search or browse all public organizations.</p>
              </div>
            ) : (
              filteredOrganizations.map((org) => (
                <Link key={org.id} href={`/organization/${org.id}`}>
                  <Card className="h-full hover:bg-muted/50 transition-colors flex flex-col">
                    <CardHeader className="flex flex-row items-start gap-4">
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={org.imageUrl || "/placeholder-logo.svg"} alt={org.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {org.name}
                          <Badge variant="outline" className="gap-1 text-xs font-normal">
                            <Globe className="h-3 w-3" />
                            Public
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">{org.description || "No description provided."}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{org._count.members} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{org._count.boards} public boards</span>
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
            {loadingBoards ? (
              renderLoading()
            ) : filteredBoards.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No boards found</h3>
                <p className="text-muted-foreground">Try adjusting your search or browse all public boards.</p>
              </div>
            ) : (
              filteredBoards.map((board) => (
                <Link key={board.id} href={`/board/${board.id}`} className="block"> 
                  <Card className="h-full hover:bg-muted/50 transition-colors overflow-hidden flex flex-col">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{board.name}</CardTitle>
                        <Badge variant="outline" className="gap-1 text-xs font-normal">
                          <Globe className="h-3 w-3" />
                          Public
                        </Badge>
                      </div>
                      <CardDescription className="mt-1 line-clamp-2">{board.description || "No description provided."}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      {board.organization ? (
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-muted-foreground flex items-center gap-1">
                            <Image src={board.organization.imageUrl || "/placeholder-logo.svg"} alt={board.organization.name} width={16} height={16} className="rounded-sm" />
                            <Link
                              href={`/organization/${board.organization.slug}`}
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {board.organization.name}
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Personal board</p>
                      )}
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
  )
}
