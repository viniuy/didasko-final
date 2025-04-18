/*
  Warnings:

  - Added the required column `courseId` to the `grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `criteriaId` to the `grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scores` to the `grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `grades` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "grades" ADD COLUMN     "courseId" TEXT NOT NULL,
ADD COLUMN     "criteriaId" TEXT NOT NULL,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "scores" JSONB NOT NULL,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE INDEX "grades_date_idx" ON "grades"("date");

-- CreateIndex
CREATE INDEX "grades_courseId_idx" ON "grades"("courseId");

-- CreateIndex
CREATE INDEX "grades_criteriaId_idx" ON "grades"("criteriaId");

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
