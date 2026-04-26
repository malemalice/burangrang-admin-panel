-- AlterTable
ALTER TABLE "t_quizzes" ADD COLUMN "isDefaultForHealthScreening" BOOLEAN NOT NULL DEFAULT false;

-- At most one row may have isDefaultForHealthScreening = true (global default template)
CREATE UNIQUE INDEX "t_quizzes_one_default_health_screening" ON "t_quizzes" ((1)) WHERE "isDefaultForHealthScreening" = true;
