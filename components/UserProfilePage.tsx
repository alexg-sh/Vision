"use client"; // Mark as a Client Component

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface Board {
  id: string
  name: string
  slug: string
  description?: string | null
  createdAt: string
  _count: { posts: number }
}

interface User {
  id: string
  username: string
  name?: string | null
  image?: string | null
  createdAt: string
  lastActive: string
  bio?: string | null
  followerCount: number // Add followerCount
  followingCount: number // Add followingCount
  isFollowing: boolean // Add isFollowing
}

interface UserProfilePageProps {
  user: User
  createdBoards: Board[]
  memberBoards: Board[]
  currentUserId?: string | null // Add currentUserId as an optional prop
}

export default function UserProfilePage({ user, createdBoards, memberBoards, currentUserId }: UserProfilePageProps) {
  const isOwnProfile = user.id === currentUserId;

  // Manage follow state and count
  const [isFollowingState, setIsFollowingState] = useState(user.isFollowing);
  const [followerCountState, setFollowerCountState] = useState(user.followerCount);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    console.log('UserProfilePage Props:', {
      userId: user.id,
      currentUserId,
      isOwnProfile,
      isFollowing: user.isFollowing,
    });
  }, [user.id, currentUserId, isOwnProfile, user.isFollowing]);

  const handleFollowClick = async () => {
    if (isLoadingFollow) return;
    setIsLoadingFollow(true);
    try {
      const method = isFollowingState ? 'DELETE' : 'POST';
      const res = await fetch(`/api/user/${user.id}/follow`, { method, credentials: 'include' });
      if (!res.ok) {
        throw new Error('Failed to update follow status');
      }
      const data = await res.json();
      setIsFollowingState(prev => !prev);
      if (typeof data.followerCount === 'number') {
        setFollowerCountState(data.followerCount);
      }
      toast({ title: isFollowingState ? 'Unfollowed' : 'Followed', description: `${user.username} has been ${isFollowingState ? 'unfollowed' : 'followed'}.` });
    } catch (error: any) {
      console.error('Follow action error:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'An error occurred.' });
    } finally {
      setIsLoadingFollow(false);
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <Avatar className="h-32 w-32">
          {user.image ? (
            <AvatarImage src={user.image} alt={user.name || user.username} />
          ) : (
            <AvatarFallback className="text-2xl">{(user.name || user.username).charAt(0)}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">{user.name || user.username}</h1>
            {/* Conditionally render Follow/Unfollow button */}
            {currentUserId && !isOwnProfile && (
              <Button variant="outline" size="sm" disabled={isLoadingFollow} onClick={handleFollowClick}>
                {isFollowingState ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{followerCountState} follower{followerCountState === 1 ? '' : 's'}</span>
            <span>&bull;</span>
            <span>{user.followingCount} following</span>
          </div>
          <p className="text-muted-foreground">@{user.username}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
            <span>|</span>
            <span>Last Active: {new Date(user.lastActive).toLocaleString()}</span>
          </div>
          <Card>
            <CardContent>
              <p className="text-sm">
                {user.bio ?? 'No bio yet. This user hasn\'t added a bio.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="created" className="space-y-4">
        <TabsList>
          <TabsTrigger value="created">Created Boards ({createdBoards.length})</TabsTrigger>
          <TabsTrigger value="member">Member Boards ({memberBoards.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="created">
          {createdBoards.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {createdBoards.map(board => (
                <Card key={board.id} className="hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle>{board.name}</CardTitle>
                    <CardDescription>{board.description || 'No description'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">Posts: {board._count.posts}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No boards created.</p>
          )}
        </TabsContent>

        <TabsContent value="member">
          {memberBoards.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {memberBoards.map(board => (
                <Card key={board.id} className="hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle>{board.name}</CardTitle>
                    <CardDescription>{board.description || 'No description'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">Posts: {board._count.posts}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not a member of any boards.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}