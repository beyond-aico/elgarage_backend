/*
  Warnings:

  - You are about to drop the column `serviceName` on the `MaintenanceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `serviceName` on the `MaintenanceRule` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serviceId]` on the table `MaintenanceRule` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serviceId` to the `MaintenanceRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MaintenanceRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceId` to the `MaintenanceRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MaintenanceRule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MaintenanceRecord" DROP COLUMN "serviceName",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "serviceId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "performedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "MaintenanceRule" DROP COLUMN "serviceName",
ADD COLUMN     "serviceId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "MaintenanceRecord_serviceId_idx" ON "MaintenanceRecord"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceRule_serviceId_key" ON "MaintenanceRule"("serviceId");

-- AddForeignKey
ALTER TABLE "MaintenanceRule" ADD CONSTRAINT "MaintenanceRule_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
