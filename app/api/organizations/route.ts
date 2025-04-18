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
    const body = await req.json();

    // Validate input
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ message: "Organization name is required." }, { status: 400 });
    }

    const slug = generateSlug(body.name);

    // Use a transaction to create org and add creator as admin member
    const organization = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newOrg = await tx.organization.create({
        data: {
          name: body.name,
          slug: slug,
          description: body.description || null,
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

    // Check for unique constraint violation (specific to Prisma/PostgreSQL)
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
       return NextResponse.json({ message: "Organization name is already taken. Please choose a different name." }, { status: 409 }); // Conflict
    }

    return NextResponse.json({ message: "Failed to create organization." }, { status: 500 });
  }
}