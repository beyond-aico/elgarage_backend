-- AlterTable
ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Part" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Car_deletedAt_idx" ON "Car"("deletedAt") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FuelLog_carId_createdAt_idx" ON "FuelLog"("carId", "createdAt" ASC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Part_deletedAt_idx" ON "Part"("deletedAt") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Service_deletedAt_idx" ON "Service"("deletedAt") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt") WHERE "deletedAt" IS NULL;