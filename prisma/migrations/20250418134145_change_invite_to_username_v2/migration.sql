/*
  Warnings:

  - You are about to drop the column `email` on the `Invite` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invitedUsername,organizationId]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[invitedUsername,boardId]` on the table `Invite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `invitedUsername` to the `Invite` table without a default value. This is not possible if the table is not empty.
  - Made the column `username` on table `User` nullable initially.

*/
-- DropIndex
DROP INDEX IF EXISTS "Invite_email_boardId_key"; -- Use IF EXISTS for safety

-- DropIndex
DROP INDEX IF EXISTS "Invite_email_organizationId_key"; -- Use IF EXISTS for safety

-- AlterTable
ALTER TABLE "Invite" DROP COLUMN IF EXISTS "email", -- Use IF EXISTS for safety
ADD COLUMN     "invitedUsername" TEXT; -- Make nullable initially if invites exist

-- Populate invitedUsername from existing data if possible (EXAMPLE - ADJUST AS NEEDED)
-- This assumes you want to migrate existing email invites to username invites.
-- If existing invites should be discarded or handled differently, modify this.
-- UPDATE "Invite" SET "invitedUsername" = (SELECT "username" FROM "User" WHERE "User"."email" = "Invite"."email") WHERE "invitedUsername" IS NULL;
-- It might be safer to handle existing invites manually or in a separate script.
-- For now, we'll leave existing invites potentially without an invitedUsername if the email column is dropped.

-- Make invitedUsername non-nullable *after* potential population or if table was empty
-- ALTER TABLE "Invite" ALTER COLUMN "invitedUsername" SET NOT NULL; -- Defer this if needed

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "username" TEXT; -- Make nullable initially

-- Populate username for existing users (EXAMPLE - using email prefix, ensure uniqueness)
-- UPDATE "User" SET "username" = substring(email from '^[^@]+') || '_' || id WHERE "username" IS NULL AND email IS NOT NULL;
-- Ensure uniqueness constraint doesn't fail. A more robust script might be needed.
-- For now, we leave existing users with NULL username. They can set it via profile update.

-- CreateIndex - Defer unique constraint on User.username if allowing NULLs temporarily
-- CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
-- Instead, create a unique index that allows NULLs (specific to PostgreSQL)
CREATE UNIQUE INDEX "User_username_key_nullable" ON "User"("username") WHERE "username" IS NOT NULL;


-- CreateIndex
CREATE UNIQUE INDEX "Invite_invitedUsername_organizationId_key" ON "Invite"("invitedUsername", "organizationId") WHERE "invitedUsername" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Invite_invitedUsername_boardId_key" ON "Invite"("invitedUsername", "boardId") WHERE "invitedUsername" IS NOT NULL;
