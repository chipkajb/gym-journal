import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronLeft } from "lucide-react";
import { TemplateForm } from "@/components/features/library/template-form";

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
  });

  if (!template) notFound();

  return (
    <div className="space-y-6">
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
        template={{
          id: template.id,
          title: template.title,
          description: template.description,
          scoreType: template.scoreType ?? "Time",
        }}
      />
    </div>
  );
}
