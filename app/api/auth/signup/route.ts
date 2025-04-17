import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const saltRounds = 10 // Cost factor for bcrypt hashing

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 })
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash, // Store the hashed password
        // Add any other default fields if necessary
      },
    })

    // Don't return the password hash in the response
    const { passwordHash: _, ...userWithoutPassword } = newUser

    return NextResponse.json(userWithoutPassword, { status: 201 })

  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
