-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "githubEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "githubRepo" VARCHAR(255),
ADD COLUMN     "githubToken" TEXT;

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "mentionNotifications" BOOLEAN NOT NULL DEFAULT true,
    "replyNotifications" BOOLEAN NOT NULL DEFAULT true,
    "voteNotifications" BOOLEAN NOT NULL DEFAULT false,
    "commentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "statusChangeNotifications" BOOLEAN NOT NULL DEFAULT true,
    "digestEmail" TEXT NOT NULL DEFAULT 'weekly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
