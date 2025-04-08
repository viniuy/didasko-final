/*
  Warnings:

  - The `permission` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('GRANTED', 'DENIED');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "permission",
ADD COLUMN     "permission" "Permission" NOT NULL DEFAULT 'DENIED';
