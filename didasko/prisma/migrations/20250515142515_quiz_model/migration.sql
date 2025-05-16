-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "quizDate" TIMESTAMP(3) NOT NULL,
    "attendanceRangeStart" TIMESTAMP(3) NOT NULL,
    "attendanceRangeEnd" TIMESTAMP(3) NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "attendance" TEXT NOT NULL,
    "plusPoints" DOUBLE PRECISION NOT NULL,
    "totalGrade" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quizzes_studentId_idx" ON "quizzes"("studentId");

-- CreateIndex
CREATE INDEX "quizzes_courseId_idx" ON "quizzes"("courseId");

-- CreateIndex
CREATE INDEX "quizzes_attendanceRangeStart_idx" ON "quizzes"("attendanceRangeStart");

-- CreateIndex
CREATE INDEX "quizzes_attendanceRangeEnd_idx" ON "quizzes"("attendanceRangeEnd");

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
