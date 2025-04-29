"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Github, RefreshCw, LinkIcon } from "lucide-react"

export default function GitHubIntegrationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  // unwrap boardId
  const { id: boardId } = React.use(params)
  const [isConnected, setIsConnected] = useState(false)
  const [repoUrl, setRepoUrl] = useState("")
  const [repos, setRepos] = useState<Array<{ name: string; fullName: string }>>([])
  const [reposError, setReposError] = useState<string | null>(null)
  const [selectedRepo, setSelectedRepo] = useState("")
  const [issues, setIssues] = useState<Array<{ number: number; title: string; url: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch board status
  useEffect(() => {
    const loadBoard = async () => {
      try {
        const res = await fetch(`/api/boards/${boardId}`)
        if (!res.ok) throw new Error('Failed to load board')
        const data = await res.json()
        setIsConnected(data.githubEnabled)
        setRepoUrl(data.githubRepo || '')
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadBoard()
  }, [boardId])

  // fetch repositories when connected without linked repo
  const fetchRepos = useCallback(async () => {
    setReposError(null)
    try {
      const res = await fetch(`/api/boards/${boardId}/github/repos`)
      const text = await res.text()
      const trimmed = text.trim()
      // No content means no repos
      if (!trimmed) {
        setRepos([])
        return
      }
      // HTML or other unexpected content
      if (trimmed.startsWith('<')) {
        throw new Error('Invalid response from GitHub API; please re-authorize your GitHub connection')
      }
      const data = JSON.parse(trimmed)
      if (!res.ok) {
        const errMsg = data.message || res.statusText
        if (res.status === 401 || res.status === 403) {
          throw new Error('Unauthorized – please re-authorize GitHub to fetch your repos')
        }
        throw new Error(errMsg)
      }
      setRepos(data)
    } catch (err: any) {
      console.error('Error loading repos:', err)
      setRepos([])
      setReposError(err.message)
    }
  }, [boardId])

  // load repository list after auth but before linking
  useEffect(() => {
    if (isConnected && !repoUrl) fetchRepos()
  }, [isConnected, repoUrl, fetchRepos])

  // load issues once a repo is linked
  const fetchIssues = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/github/issues`)
      if (!res.ok) throw new Error('Failed to load issues')
      const items = await res.json()
      setIssues(items)
    } catch (err) {
      console.error('Error loading issues:', err)
      setIssues([])
    }
  }, [boardId])
  useEffect(() => {
    if (repoUrl) fetchIssues()
  }, [repoUrl, fetchIssues])

  const handleConnect = () => {
    // redirect to OAuth flow
    window.location.href = `/api/boards/${boardId}/github/connect`
  }

  const handleLinkRepo = async () => {
    if (!selectedRepo) return
    setLoading(true)
    try {
      const res = await fetch(`/api/boards/${boardId}/github`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubEnabled: true, githubRepo: selectedRepo }),
      })
      // Safely parse JSON or fallback to handle HTML/errors
      const text = await res.text()
      let data: any
      try {
        data = JSON.parse(text)
      } catch (jsonErr) {
        console.error('handleLinkRepo: Unexpected response:', text)
        throw new Error('Unexpected server response – please try again or re-authorize GitHub')
      }
      if (!res.ok) {
        throw new Error(data.message || `Link failed: ${res.status}`)
      }
      // Success
      setIsConnected(true)
      setRepoUrl(selectedRepo)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/boards/${boardId}/github`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).message)
      setIsConnected(false)
      setRepoUrl('')
      setIssues([])
      setRepos([])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <main className="flex-1 container py-6">
      <Button variant="ghost" size="icon" onClick={() => router.push(`/board/${boardId}/settings`)}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h1 className="text-2xl font-bold mb-4">GitHub Integration</h1>

      {!isConnected ? (
        <Card>
          <CardHeader><CardTitle>Connect to GitHub</CardTitle></CardHeader>
          <CardContent className="flex justify-center py-8">
            <Button onClick={handleConnect} size="sm">
              Authorize GitHub
            </Button>
          </CardContent>
        </Card>
      ) : !repoUrl ? (
        <Card>
          <CardHeader><CardTitle>Select a Repository</CardTitle></CardHeader>
          <CardContent>
            {repos.length > 0 ? (
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full mb-4 border rounded p-2"
              >
                <option value="">-- choose repo --</option>
                {repos.map(r => (
                  <option key={r.fullName} value={r.fullName}>{r.fullName}</option>
                ))}
              </select>
            ) : (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">{reposError || 'No repositories found.'}</p>
                <div className="flex gap-4 mt-2">
                  <Button variant="link" size="sm" onClick={fetchRepos} className="flex items-center">
                    <RefreshCw className="mr-1 h-4 w-4" /> Refresh
                  </Button>
                  {reposError?.toLowerCase().includes('unauthorized') && (
                    <Button variant="link" size="sm" onClick={handleConnect} className="flex items-center">
                      <LinkIcon className="mr-1 h-4 w-4" /> Re-authorize
                    </Button>
                  )}
                </div>
              </div>
            )}
            <Button onClick={handleLinkRepo} disabled={!selectedRepo}>
              Link Repository
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
        <Card>
          <CardHeader><CardTitle>Linked Repository</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4">{repoUrl}</p>
            <Button onClick={handleDisconnect}>Disconnect</Button>
          </CardContent>
        </Card>
        {issues.length > 0 && (
          <Card className="mt-6">
            <CardHeader><CardTitle>Open Issues</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {issues.map(issue => (
                  <li key={issue.number}>
                    <a href={issue.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      #{issue.number} {issue.title}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        </>
      )}
    </main>
  )
}
