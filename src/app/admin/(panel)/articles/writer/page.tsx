import { requireAdmin } from "@/lib/admin";
import { ArticleWriter } from "./article-writer";

export default async function ArticleWriterPage() {
  await requireAdmin();

  return <ArticleWriter />;
}
