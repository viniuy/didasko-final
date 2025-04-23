/*
  Warnings:

  - You are about to drop the `admin_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `admins` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "admin_sessions" DROP CONSTRAINT "admin_sessions_adminId_fkey";

-- DropTable
DROP TABLE "admin_sessions";

-- DropTable
DROP TABLE "admins";
