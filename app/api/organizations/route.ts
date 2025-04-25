import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed
import { Prisma } from "@prisma/client";

// Helper function to generate a slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove invalid characters
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json(); // This line can throw SyntaxError

    // Validate input
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") { // Added trim check
      return NextResponse.json({ message: "Organization name is required and cannot be empty." }, { status: 400 });
    }
    // Optional: Add validation for description length if needed
    // if (body.description && typeof body.description !== "string") {
    //   return NextResponse.json({ message: "Invalid description format." }, { status: 400 });
    // }

    const slug = generateSlug(body.name);
    if (!slug) {
        // Handle cases where the name results in an empty slug (e.g., name consists only of invalid characters)
        return NextResponse.json({ message: "Invalid organization name resulting in empty slug." }, { status: 400 });
    }

    // Use a transaction to create org and add creator as admin member
    const organization = await prisma.$transaction(async (tx) => { // Removed explicit type Prisma.TransactionClient for brevity
      const newOrg = await tx.organization.create({
        data: {
          name: body.name.trim(), // Trim name before saving
          slug: slug,
          description: body.description?.trim() || null, // Trim description
          // Add other fields like image, isPrivate if needed
        },
      });

      await tx.organizationMember.create({
        data: {
          userId: userId,
          organizationId: newOrg.id,
          role: 'ADMIN', // Assign the creator as ADMIN
        },
      });

      return newOrg;
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error: any) {
    console.error("Error creating organization:", error);

    // Specific check for JSON parsing errors
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: "Invalid request body: Malformed JSON." }, { status: 400 });
    }

    // Check for unique constraint violation (specific to Prisma/PostgreSQL)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && Array.isArray(error.meta?.target) && error.meta.target.includes('slug')) {
       return NextResponse.json({ message: "Organization name is already taken. Please choose a different name." }, { status: 409 }); // Conflict
    }

    // Generic error for other issues
    return NextResponse.json({ message: "Failed to create organization.", error: error.message }, { status: 500 });
  }
}