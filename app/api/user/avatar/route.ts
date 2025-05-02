import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

async function uploadAvatarToServer(file: File): Promise<string> {
  console.log(`Simulating upload for file: ${file.name}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  return `/uploads/avatars/placeholder-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No avatar file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ message: 'Invalid file type, please upload an image.' }, { status: 400 });
    }

    const newAvatarUrl = await uploadAvatarToServer(file);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: newAvatarUrl },
      select: { image: true }
    });

    return NextResponse.json({ message: 'Avatar updated successfully', avatarUrl: updatedUser.image }, { status: 200 });

  } catch (error) {
    console.error('Avatar upload error:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    if (process.env.NODE_ENV === 'production') {
        errorMessage = 'Internal Server Error';
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
