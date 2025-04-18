/*
  Warnings:

  - You are about to drop the column `imageData` on the `students` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "students" DROP COLUMN "imageData",
ADD COLUMN     "image" TEXT;
