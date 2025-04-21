/*
  Warnings:

  - You are about to drop the column `bannedBy` on the `OrganizationBan` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invitedUsername,organizationId]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invitedUsername,boardId]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "boardId" TEXT;

-- AlterTable
ALTER TABLE "BoardMember" ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "bannedByUserId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "OrganizationBan" DROP COLUMN "bannedBy",
ADD COLUMN     "bannedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_boardId_idx" ON "AuditLog"("boardId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "BoardMember_bannedByUserId_idx" ON "BoardMember"("bannedByUserId");

-- CreateIndex
CREATE INDEX "OrganizationBan_bannedByUserId_idx" ON "OrganizationBan"("bannedByUserId");

-- AddForeignKey
ALTER TABLE "OrganizationBan" ADD CONSTRAINT "OrganizationBan_bannedByUserId_fkey" FOREIGN KEY ("bannedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardMember" ADD CONSTRAINT "BoardMember_bannedByUserId_fkey" FOREIGN KEY ("bannedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
