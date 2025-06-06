/*
  Warnings:

  - A unique constraint covering the columns `[studentId]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `studentId` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "students" ADD COLUMN     "studentId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "students_studentId_key" ON "students"("studentId");
