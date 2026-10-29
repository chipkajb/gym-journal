import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TemplateForm } from "@/components/features/library/template-form";

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/training?tab=library"
          className="p-2 rounded-lg text-muted-foreground hover:bg-accent"
          aria-label="Back to library"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          New workout template
        </h1>
      </div>

      <TemplateForm />
    </div>
  );
}
