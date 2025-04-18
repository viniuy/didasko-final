/*
  Warnings:

  - You are about to drop the column `image` on the `students` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "students" DROP COLUMN "image",
ADD COLUMN     "profile_image" TEXT;
