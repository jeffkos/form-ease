/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `language` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'PREMIUM', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('FR', 'EN');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
DROP COLUMN "language",
ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'FR';
