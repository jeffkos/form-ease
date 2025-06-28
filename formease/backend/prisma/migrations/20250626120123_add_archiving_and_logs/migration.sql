-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archived_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archived_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ArchiveLog" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "entity" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchiveLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ArchiveLog" ADD CONSTRAINT "ArchiveLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
