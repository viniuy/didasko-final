/*
  Warnings:

  - You are about to drop the `student_images` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "student_images" DROP CONSTRAINT "student_images_studentId_fkey";

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "imageData" JSONB;

-- DropTable
DROP TABLE "student_images";
