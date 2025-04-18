/*
  Warnings:

  - You are about to drop the column `scheduleId` on the `attendance` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `criteria` table. All the data in the column will be lost.
  - You are about to drop the `CourseSchedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Student` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EnrolledStudents` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `courseId` to the `criteria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passingScore` to the `criteria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rubrics` to the `criteria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scoringRange` to the `criteria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `criteria` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CourseSchedule" DROP CONSTRAINT "CourseSchedule_courseId_fkey";

-- DropForeignKey
ALTER TABLE "_EnrolledStudents" DROP CONSTRAINT "_EnrolledStudents_A_fkey";

-- DropForeignKey
ALTER TABLE "_EnrolledStudents" DROP CONSTRAINT "_EnrolledStudents_B_fkey";

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "criteria" DROP CONSTRAINT "criteria_classId_fkey";

-- DropForeignKey
ALTER TABLE "grades" DROP CONSTRAINT "grades_studentId_fkey";

-- AlterTable
ALTER TABLE "attendance" DROP COLUMN "scheduleId";

-- AlterTable
ALTER TABLE "criteria" DROP COLUMN "classId",
ADD COLUMN     "courseId" TEXT NOT NULL,
ADD COLUMN     "passingScore" TEXT NOT NULL,
ADD COLUMN     "rubrics" JSONB NOT NULL,
ADD COLUMN     "scoringRange" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "CourseSchedule";

-- DropTable
DROP TABLE "Student";

-- DropTable
DROP TABLE "_EnrolledStudents";

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleInitial" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_schedules" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "fromTime" TEXT NOT NULL,
    "toTime" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StudentCourses" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StudentCourses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_StudentCourses_B_index" ON "_StudentCourses"("B");

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criteria" ADD CONSTRAINT "criteria_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criteria" ADD CONSTRAINT "criteria_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_schedules" ADD CONSTRAINT "course_schedules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentCourses" ADD CONSTRAINT "_StudentCourses_A_fkey" FOREIGN KEY ("A") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentCourses" ADD CONSTRAINT "_StudentCourses_B_fkey" FOREIGN KEY ("B") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
