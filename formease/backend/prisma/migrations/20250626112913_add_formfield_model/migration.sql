-- CreateTable
CREATE TABLE "FormField" (
    "id" SERIAL NOT NULL,
    "form_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "label_fr" TEXT NOT NULL,
    "label_en" TEXT NOT NULL,
    "options" JSONB,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "style" JSONB,
    "placeholder_fr" TEXT,
    "placeholder_en" TEXT,
    "default_value" TEXT,

    CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
