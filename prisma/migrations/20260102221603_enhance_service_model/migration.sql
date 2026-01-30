/*
  Warnings:

  - Added the required column `updatedAt` to the `Service` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "description" TEXT,
ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" DROP DEFAULT;
