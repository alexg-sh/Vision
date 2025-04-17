import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

const saltRounds = 10; // Consistent with signup

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (newPassword.length < 6) { // Add basic password length validation
        return NextResponse.json({ message: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.passwordHash) {
      // This case might happen if the user signed up via OAuth and doesn't have a password set
      return NextResponse.json({ message: 'User not found or password not set' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ message: 'Invalid current password' }, { status: 400 });
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate other sessions if implementing full session management

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Password update error:', error);
    // Type guard for error object
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
        errorMessage = error.message; // More specific error if available
    }
     // Avoid sending potentially sensitive error details to the client in production
     if (process.env.NODE_ENV === 'production') {
        errorMessage = 'Internal Server Error';
     }

    return NextResponse.json({ message: errorMessage }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
