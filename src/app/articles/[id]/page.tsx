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
      <div className="flex gap-4 text-sm">
        <Link href="/" className="link text-muted">
          Home
        </Link>
        <Link href="/articles" className="link text-muted">
          All knowledge
        </Link>
      </div>

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
