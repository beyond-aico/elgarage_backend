/*
  Warnings:

  - A unique constraint covering the columns `[vin]` on the table `Car` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[plateNumber]` on the table `Car` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `color` to the `Car` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plateNumber` to the `Car` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vin` to the `Car` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "color" TEXT NOT NULL,
ADD COLUMN     "plateNumber" TEXT NOT NULL,
ADD COLUMN     "vin" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Car_vin_key" ON "Car"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "Car_plateNumber_key" ON "Car"("plateNumber");
