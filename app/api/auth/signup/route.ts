import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const saltRounds = 10

export async function POST(request: Request) {
  try {
    const { name, email, password, username } = await request.json()

    if (!name || !email || !password || !username) {
      return NextResponse.json({ message: 'Missing required fields (name, email, password, username)' }, { status: 400 })
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
        return NextResponse.json({ message: 'Invalid username format. Use 3-20 alphanumeric characters or underscores.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username as any }
        ]
       },
    })

    if (existingUser) {
        if (existingUser.email === email) {
            return NextResponse.json({ message: 'Email already in use' }, { status: 409 })
        }
        if ((existingUser as any).username === username) {
            return NextResponse.json({ message: 'Username already taken' }, { status: 409 })
        }
    }

    const passwordHash = await bcrypt.hash(password, saltRounds)

    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          username: username as any,
          passwordHash,
        },
      });

      const pendingInvites = await tx.invite.findMany({
        where: {
          invitedUsername: username,
          status: "PENDING",
          invitedUserId: null,
        },
        select: {
          id: true,
        },
      });

      if (pendingInvites.length > 0) {
        const inviteIds = pendingInvites.map(invite => invite.id);

        await tx.invite.updateMany({
          where: {
            id: { in: inviteIds },
          },
          data: {
            invitedUserId: createdUser.id,
          },
        });

        await tx.notification.updateMany({
          where: {
            inviteId: { in: inviteIds },
            userId: undefined,
          },
          data: {
            userId: createdUser.id,
          },
        });
      }

      const { passwordHash: _, ...userWithoutPassword } = createdUser as any;
      return userWithoutPassword;
    });

    return NextResponse.json({ message: 'User created successfully', user: newUser }, { status: 201 })

  } catch (error) {
    console.error('Signup error:', error)
    if (error instanceof Error && (error as any).code === 'P2002') {
        const target = (error as any).meta?.target;
        if (target && target.includes('email')) {
            return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
        }
        if (target && target.includes('username')) {
            return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
        }
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
