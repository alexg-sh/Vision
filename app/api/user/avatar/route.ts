import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Placeholder for actual file upload logic (e.g., to S3, Cloudinary)
async function uploadAvatarToServer(file: File): Promise<string> {
  console.log(`Simulating upload for file: ${file.name}`);
  // In a real implementation:
  // 1. Upload the file to your storage provider.
  // 2. Get the public URL of the uploaded file.
  // For now, return a placeholder URL based on the filename (NOT secure/unique)
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
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

    // Basic validation (add more as needed: size, type)
    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ message: 'Invalid file type, please upload an image.' }, { status: 400 });
    }

    // --- Upload Logic --- 
    // Replace this placeholder with your actual upload implementation
    const newAvatarUrl = await uploadAvatarToServer(file);
    // --- End Upload Logic ---

    // Update user record in the database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: newAvatarUrl }, // Assuming 'image' field stores the avatar URL
      select: { image: true } // Only select the updated image URL
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
