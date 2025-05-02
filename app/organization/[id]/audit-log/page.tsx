"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Filter, Search } from "lucide-react"

interface AuditLogEntry {
  id: number | string
  action: string
  user: string
  userRole: string
  timestamp: string
  details: string
  boardId: number | string | null
  boardName: string | null
}

interface Organization {
  id: number | string
  name: string
}

export default function OrganizationAuditLogPage({ params: paramsProp }: { params: { id: string } }) {
  const params = paramsProp // Correctly unwrap params
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterAction, setFilterAction] = useState("")
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // TODO: Replace with actual API calls
        // Fetch organization details
        // const orgResponse = await fetch(`/api/organization/${params.id}`);
        // if (!orgResponse.ok) throw new Error('Failed to fetch organization details');
        // const orgData: Organization = await orgResponse.json();
        // setOrganization(orgData);

        // Simulate fetching organization data
        setOrganization({ id: params.id, name: "Organization Name" }) // Placeholder name

        // Fetch audit logs
        // const logResponse = await fetch(`/api/organization/${params.id}/audit-log`);
        // if (!logResponse.ok) throw new Error('Failed to fetch audit logs');
        // const logData: AuditLogEntry[] = await logResponse.json();
        // setAuditLogs(logData);

        // Simulate fetching logs (remove this when using real API)
        setAuditLogs([]) // Start with empty logs
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    // Use the unwrapped params.id here
    if (params.id) {
      fetchData()
    }
    // And here in the dependency array
  }, [params.id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.boardName && log.boardName.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesAction = filterAction === "" || log.action === filterAction

    return matchesSearch && matchesAction
  })

  const uniqueActions = Array.from(new Set(auditLogs.map((log) => log.action)))

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!organization) {
    return <div>Organization not found.</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container py-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/organization/${params.id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Organization Audit Log</h1>
            <p className="text-muted-foreground">
              Viewing audit log for{" "}
              <Link href={`/organization/${params.id}`} className="text-primary hover:underline">
                {organization.name}
              </Link>
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>Track all actions performed across the organization and its boards.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, action, or board..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterAction === "" ? "default" : "outline"}
                  onClick={() => setFilterAction("")}
                  className="whitespace-nowrap"
                >
                  All Actions
                </Button>
                <div className="relative">
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                  <div className="absolute right-0 top-10 z-10 w-48 rounded-md border bg-background shadow-md">
                    {uniqueActions.map((action) => (
                      <Button
                        key={action}
                        variant="ghost"
                        className="w-full justify-start capitalize"
                        onClick={() => setFilterAction(action)}
                      >
                        {action.replace("-", " ")}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No audit logs found matching your criteria</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      <div className="rounded-full bg-muted p-2">
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div>
                          <span className="font-medium">{log.user}</span>{" "}
                          <Badge variant="outline" className="text-xs capitalize">
                            {log.userRole}
                          </Badge>{" "}
                          <span className="text-muted-foreground">{log.action.replace("-", " ")}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatDate(log.timestamp)}</span>
                      </div>
                      <p className="text-sm mt-1">{log.details}</p>
                      {log.boardId && (
                        <div className="mt-2">
                          <Link
                            href={`/board/${log.boardId}`}
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            View board: {log.boardName}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
