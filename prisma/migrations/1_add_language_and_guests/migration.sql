-- CreateEnum
CREATE TYPE "TourLanguage" AS ENUM ('ENGLISH', 'SPANISH', 'BILINGUAL');

-- AlterTable
ALTER TABLE "Slot" ADD COLUMN     "expectedGuests" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "language" "TourLanguage" NOT NULL DEFAULT 'ENGLISH';

