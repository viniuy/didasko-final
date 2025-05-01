/*
  Warnings:

  - Made the column `room` on table `courses` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "courses" ALTER COLUMN "room" SET NOT NULL;

-- AlterTable
ALTER TABLE "criteria" ALTER COLUMN "rubrics" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "rubrics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "criteriaId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rubrics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "rubrics" ADD CONSTRAINT "rubrics_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
