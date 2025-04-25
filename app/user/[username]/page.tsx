import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import UserProfilePage from '@/components/UserProfilePage'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export default async function UserProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      bio: true,
      website: true,
      twitter: true,
      linkedin: true,
      github: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { followers: true, following: true }
      },
      createdBoards: {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: { select: { posts: true } }
        }
      },
      boardMembers: {
        where: { status: 'ACTIVE' },
        select: {
          board: {
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true,
              _count: { select: { posts: true } }
            }
          }
        }
      },
      followers: currentUserId ? { where: { followerId: currentUserId }, select: { id: true } } : false,
    }
  })

  if (!user) {
    notFound()
  }

  const memberBoards = user.boardMembers.map((bm: { board: { id: string; name: string | null; description: string | null; createdAt: Date; _count: { posts: number } } }) => bm.board)
  const isFollowing = Boolean(user.followers && user.followers.length)

  return (
    <UserProfilePage
      user={{
        id: user.id,
        username: user.username ?? '',
        name: user.name,
        image: user.image,
        bio: user.bio,
        createdAt: user.createdAt.toISOString(),
        lastActive: user.updatedAt.toISOString(),
        followerCount: user._count.followers,
        followingCount: user._count.following,
        isFollowing,
        website: user.website,
        twitter: user.twitter,
        linkedin: user.linkedin,
        github: user.github,
      }}
      createdBoards={user.createdBoards.map((board) => ({
        id: board.id,
        name: board.name,
        slug: board.name.toLowerCase().replace(/\s+/g, '-'),
        description: board.description,
        createdAt: board.createdAt.toISOString(),
        _count: board._count,
      }))}
      memberBoards={memberBoards.map(board => ({
        id: board.id,
        name: board.name ?? '',
        slug: board.name ? board.name.toLowerCase().replace(/\s+/g, '-') : '',
        description: board.description,
        createdAt: board.createdAt.toISOString(),
        _count: board._count,
      }))}
      currentUserId={currentUserId}
    />
  )
}
