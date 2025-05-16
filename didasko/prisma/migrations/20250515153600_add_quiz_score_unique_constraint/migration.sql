/*
  Warnings:

  - A unique constraint covering the columns `[quizId,studentId]` on the table `quiz_scores` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "quiz_scores_quizId_studentId_key" ON "quiz_scores"("quizId", "studentId");
