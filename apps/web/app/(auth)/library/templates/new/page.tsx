import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TemplateForm } from "@/components/features/library/template-form";

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/training?tab=library"
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Back to library"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          New workout template
        </h1>
      </div>

      <TemplateForm />
    </div>
  );
}
