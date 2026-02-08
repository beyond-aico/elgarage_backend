-- AlterTable
ALTER TABLE "_CarModelToPart" ADD CONSTRAINT "_CarModelToPart_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_CarModelToPart_AB_unique";
