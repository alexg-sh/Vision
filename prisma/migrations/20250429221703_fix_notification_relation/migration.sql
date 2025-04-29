-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "githubIssueNumber" INTEGER,
ADD COLUMN     "githubIssueStatus" TEXT,
ADD COLUMN     "githubIssueUrl" VARCHAR(255);
