/*
  Warnings:

  - You are about to drop the `CourseSchedule` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CourseSchedule" DROP CONSTRAINT "CourseSchedule_courseId_fkey";

-- DropForeignKey
ALTER TABLE "_EnrolledStudents" DROP CONSTRAINT "_EnrolledStudents_A_fkey";

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_scheduleId_fkey";

-- DropTable
DROP TABLE "CourseSchedule";

-- CreateTable
CREATE TABLE "course_schedules" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_schedules_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "course_schedules" ADD CONSTRAINT "course_schedules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "course_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EnrolledStudents" ADD CONSTRAINT "_EnrolledStudents_A_fkey" FOREIGN KEY ("A") REFERENCES "course_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
