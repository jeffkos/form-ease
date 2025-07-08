-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "page" TEXT,
    "importance" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);
