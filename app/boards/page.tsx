import React from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type BoardData = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  isPrivate: boolean;
}

export default async function BoardsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login')
  }
  const userId = session.user.id

  const createdBoards = await prisma.board.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, description: true, image: true, isPrivate: true }
  })

  const memberBoards = await prisma.board.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, description: true, image: true, isPrivate: true }
  })

  return (
    <main className="container py-8 space-y-8">
      <h1 className="text-2xl font-bold">Your Boards</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Created Boards ({createdBoards.length})</h2>
        {createdBoards.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {createdBoards.map((board: BoardData) => (
              <Link key={board.id} href={`/board/${board.id}`}> 
                <Card className="hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle>{board.name}</CardTitle>
                    <CardDescription>{board.description || 'No description'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={board.isPrivate ? 'outline' : 'secondary'}>
                      {board.isPrivate ? 'Private' : 'Public'}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">You haven't created any boards yet.</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Joined Boards ({memberBoards.length})</h2>
        {memberBoards.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {memberBoards.map((board: BoardData) => (
              <Link key={board.id} href={`/board/${board.id}`}> 
                <Card className="hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle>{board.name}</CardTitle>
                    <CardDescription>{board.description || 'No description'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={board.isPrivate ? 'outline' : 'secondary'}>
                      {board.isPrivate ? 'Private' : 'Public'}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">You haven't joined any boards yet.</p>
        )}
      </section>
    </main>
  )
}