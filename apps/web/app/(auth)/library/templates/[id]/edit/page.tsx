import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronLeft } from "lucide-react";
import { TemplateForm } from "@/components/features/library/template-form";
import { TemplateExercisesEditor } from "@/components/features/library/template-exercises-editor";

const CATEGORIES = ["Strength", "Cardio", "CrossFit", "Flexibility"];

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const { id } = await params;
  const template = await prisma.workoutTemplate.findFirst({
    where: { id, userId: session.user.id },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!template) notFound();

  const exercises = await prisma.exercise.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/library"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to library"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit template
        </h1>
      </div>

      <TemplateForm
        categories={CATEGORIES}
        template={{
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          tags: template.tags,
        }}
      />

      <TemplateExercisesEditor
        templateId={template.id}
        templateExercises={template.exercises.map((te) => ({
          id: te.id,
          exerciseId: te.exerciseId,
          exerciseName: te.exercise.name,
          orderIndex: te.orderIndex,
          sets: te.sets,
          reps: te.reps,
          duration: te.duration,
          restTime: te.restTime,
          notes: te.notes,
        }))}
        allExercises={exercises}
      />
    </div>
  );
}
