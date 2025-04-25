/*
  Warnings:

  - You are about to drop the column `organizationId` on the `AuditLog` table. All the data in the column will be lost.
  - Made the column `userId` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `entityId` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropIndex
DROP INDEX "AuditLog_boardId_idx";

-- DropIndex
DROP INDEX "AuditLog_organizationId_idx";

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "organizationId",
ADD COLUMN     "entityName" TEXT,
ADD COLUMN     "orgId" TEXT,
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "entityId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "AuditLog_orgId_createdAt_idx" ON "AuditLog"("orgId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_boardId_createdAt_idx" ON "AuditLog"("boardId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
