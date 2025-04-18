/*
  Warnings:

  - You are about to drop the column `profile_image` on the `students` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "students" DROP COLUMN "profile_image",
ADD COLUMN     "image" TEXT;
