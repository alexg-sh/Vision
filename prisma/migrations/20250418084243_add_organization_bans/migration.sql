-- CreateTable
CREATE TABLE "OrganizationBan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "banReason" TEXT,
    "bannedBy" TEXT,

    CONSTRAINT "OrganizationBan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationBan_organizationId_idx" ON "OrganizationBan"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationBan_userId_organizationId_key" ON "OrganizationBan"("userId", "organizationId");

-- AddForeignKey
ALTER TABLE "OrganizationBan" ADD CONSTRAINT "OrganizationBan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationBan" ADD CONSTRAINT "OrganizationBan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
