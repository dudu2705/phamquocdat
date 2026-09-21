import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { imageUrl } from "@/lib/s3";
import { deleteArticle } from "../../../../article-actions";
import { DeleteButton } from "../../../delete-button";
import { ArticleForm } from "../../article-form";

export default async function EditArticlePage({
  params,
}: PageProps<"/admin/articles/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <ArticleForm
        article={{
          id: article.id,
          title: article.title,
          author: article.author,
          content: article.content,
          imageUrl: imageUrl(article.image),
        }}
      />
      <div className="ornament">&#9670;</div>
      <DeleteButton action={deleteArticle.bind(null, article.id)} label="Delete article" />
    </div>
  );
}
