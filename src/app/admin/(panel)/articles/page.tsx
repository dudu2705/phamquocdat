import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { imageUrl } from "@/lib/s3";

export default async function AdminArticlesPage() {
  await requireAdmin();
  const articles = await prisma.article.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="title text-2xl">Articles</h1>
        <Link href="/admin/articles/new" className="btn btn-primary">
          Add article
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="text-muted">No articles yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {articles.map((article) => (
            <li key={article.id} className="card space-y-2">
              <Image
                src={imageUrl(article.image)}
                alt={article.title}
                width={400}
                height={225}
                unoptimized
                className="aspect-video w-full object-cover"
              />
              <p className="truncate text-bone">{article.title}</p>
              <p className="truncate text-sm text-muted">By {article.author}</p>
              <Link href={`/admin/articles/${article.id}/edit`} className="btn w-full">
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
