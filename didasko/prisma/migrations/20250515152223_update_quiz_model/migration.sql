/*
  Warnings:

  - You are about to drop the column `attendance` on the `quizzes` table. All the data in the column will be lost.
  - You are about to drop the column `plusPoints` on the `quizzes` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `quizzes` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `quizzes` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `quizzes` table. All the data in the column will be lost.
  - You are about to drop the column `totalGrade` on the `quizzes` table. All the data in the column will be lost.
  - Added the required column `passingRate` to the `quizzes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_studentId_fkey";

-- DropIndex
DROP INDEX "quizzes_studentId_idx";

-- AlterTable
ALTER TABLE "quizzes" DROP COLUMN "attendance",
DROP COLUMN "plusPoints",
DROP COLUMN "remarks",
DROP COLUMN "score",
DROP COLUMN "studentId",
DROP COLUMN "totalGrade",
ADD COLUMN     "passingRate" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "quiz_scores" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "attendance" TEXT NOT NULL,
    "plusPoints" DOUBLE PRECISION NOT NULL,
    "totalGrade" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quiz_scores_quizId_idx" ON "quiz_scores"("quizId");

-- CreateIndex
CREATE INDEX "quiz_scores_studentId_idx" ON "quiz_scores"("studentId");

-- AddForeignKey
ALTER TABLE "quiz_scores" ADD CONSTRAINT "quiz_scores_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_scores" ADD CONSTRAINT "quiz_scores_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
