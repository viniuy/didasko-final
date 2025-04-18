-- Add unique constraint
ALTER TABLE "grades" ADD CONSTRAINT "grades_studentId_courseId_date_key" UNIQUE ("studentId", "courseId", "date");

-- Add missing relations
ALTER TABLE "grades" ADD CONSTRAINT "grades_value_check" CHECK (value >= 0);
ALTER TABLE "grades" ADD CONSTRAINT "grades_total_check" CHECK (total >= 0); 