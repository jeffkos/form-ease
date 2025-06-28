-- CreateTable
CREATE TABLE "Form" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "form_id" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "validated_at" TIMESTAMP(3),
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "notified_at" TIMESTAMP(3),
    "mail_opened" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
