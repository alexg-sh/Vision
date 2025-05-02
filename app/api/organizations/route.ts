import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@prisma/client";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();

    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json({ message: "Organization name is required and cannot be empty." }, { status: 400 });
    }

    const slug = generateSlug(body.name);
    if (!slug) {
        return NextResponse.json({ message: "Invalid organization name resulting in empty slug." }, { status: 400 });
    }

    const organization = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: {
          name: body.name.trim(),
          slug: slug,
          description: body.description?.trim() || null,
        },
      });

      await tx.organizationMember.create({
        data: {
          userId: userId,
          organizationId: newOrg.id,
          role: 'ADMIN',
        },
      });

      return newOrg;
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error: any) {
    console.error("Error creating organization:", error);

    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: "Invalid request body: Malformed JSON." }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && Array.isArray(error.meta?.target) && error.meta.target.includes('slug')) {
       return NextResponse.json({ message: "Organization name is already taken. Please choose a different name." }, { status: 409 });
    }

    return NextResponse.json({ message: "Failed to create organization.", error: error.message }, { status: 500 });
  }
}