-- AlterTable
ALTER TABLE "User" ADD COLUMN "createdByAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserModules" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- AlterTable
ALTER TABLE "Dog" ADD COLUMN "createdByAdminId" TEXT;

-- AlterTable
ALTER TABLE "TrainingSession" ADD COLUMN "createdByAdminId" TEXT;

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN "createdByAdminId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Module_key_key" ON "Module"("key");

-- CreateIndex
CREATE UNIQUE INDEX "_UserModules_AB_unique" ON "_UserModules"("A", "B");

-- CreateIndex
CREATE INDEX "_UserModules_B_index" ON "_UserModules"("B");

-- AddForeignKey
ALTER TABLE "Dog" ADD CONSTRAINT "Dog_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserModules" ADD CONSTRAINT "_UserModules_A_fkey" FOREIGN KEY ("A") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserModules" ADD CONSTRAINT "_UserModules_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed core access modules
INSERT INTO "Module" ("id", "key", "name", "description", "contentIds", "createdAt", "updatedAt")
VALUES
  ('module_dogs', 'DOGS', 'Acompanhamento dos Caes', 'Ficha do cao, historico e observacoes do acompanhamento.', ARRAY[]::TEXT[], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('module_training', 'TRAINING', 'Treinos Liberados', 'Treinos e sequencias designados pela equipe K9.', ARRAY[]::TEXT[], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('module_schedule', 'SCHEDULE', 'Agenda de Acompanhamento', 'Eventos e sessoes criados pela equipe para o cliente.', ARRAY[]::TEXT[], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('module_courses', 'COURSES', 'Cursos Liberados', 'Cursos e trilhas atribuidos manualmente ao cliente.', ARRAY[]::TEXT[], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('module_content_library', 'CONTENT_LIBRARY', 'Biblioteca K9', 'Guias, materiais de apoio e conteudos complementares.', ARRAY[]::TEXT[], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
