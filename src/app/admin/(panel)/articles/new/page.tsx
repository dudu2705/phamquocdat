import { requireAdmin } from "@/lib/admin";
import { ArticleForm } from "../article-form";

export default async function NewArticlePage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-xl">
      <ArticleForm />
    </div>
  );
}
