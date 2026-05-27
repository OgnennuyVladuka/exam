/*
  Warnings:

  - Added the required column `updatedAt` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Review_bookingId_idx" ON "Review"("bookingId");
