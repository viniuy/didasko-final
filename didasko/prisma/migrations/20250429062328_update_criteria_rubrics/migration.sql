/*
  Warnings:

  - You are about to drop the column `rubrics` on the `criteria` table. All the data in the column will be lost.
  - Added the required column `numRubrics` to the `criteria` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "criteria" DROP COLUMN "rubrics",
ADD COLUMN     "numRubrics" TEXT NOT NULL;
