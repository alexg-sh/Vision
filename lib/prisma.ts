// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

const _prisma = new PrismaClient();
export const prisma = _prisma as any;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
