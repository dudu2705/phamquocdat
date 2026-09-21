import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { imageUrl } from "@/lib/s3";

export default async function ArticlePage({ params }: PageProps<"/articles/[id]">) {
  await connection();
  const { id } = await params;

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-8">
      <Link href="/articles" className="link inline-block text-sm text-muted">
        All knowledge
      </Link>

      <h1 className="title text-4xl">{article.title}</h1>

      <Image
        src={imageUrl(article.image)}
        alt={article.title}
        width={1200}
        height={675}
        unoptimized
        className="aspect-video w-full border object-cover"
      />

      <p className="whitespace-pre-line text-lg leading-relaxed">{article.content}</p>

      <div className="ornament">&#9670;</div>
      <p className="text-center text-muted">
        Written by <span className="text-bone">{article.author}</span>
      </p>
    </main>
  );
}
