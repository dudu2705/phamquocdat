import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { imageUrl } from "@/lib/s3";

export default async function ArticlesPage() {
  await connection();
  const articles = await prisma.article.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <Link href="/" className="link inline-block text-sm text-muted">
        Home
      </Link>

      <h1 className="title text-3xl">Esoteric Knowledge</h1>
      <div className="ornament">&#9670;</div>

      {articles.length === 0 ? (
        <p className="text-muted">Nothing has been written yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {articles.map((article) => (
            <li key={article.id}>
              <Link
                href={`/articles/${article.id}`}
                className="card block space-y-2 hover:border-gold hover:shadow-[0_0_28px_rgb(143_29_29/0.4)]"
              >
                <Image
                  src={imageUrl(article.image)}
                  alt={article.title}
                  width={400}
                  height={225}
                  unoptimized
                  className="aspect-video w-full object-cover"
                />
                <p className="truncate text-lg text-bone">{article.title}</p>
                <p className="text-sm text-muted">By {article.author}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
