/*
  Warnings:

  - You are about to drop the column `image` on the `students` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "students" DROP COLUMN "image";

-- CreateTable
CREATE TABLE "student_images" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_images_studentId_key" ON "student_images"("studentId");

-- AddForeignKey
ALTER TABLE "student_images" ADD CONSTRAINT "student_images_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
