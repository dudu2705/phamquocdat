"use server";

import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import {
  type ArticleFormState,
  MAX_AUTHOR_LENGTH,
  MAX_CONTENT_LENGTH,
  MAX_TITLE_LENGTH,
} from "@/lib/articles";
import { validateImageFiles } from "@/lib/images";
import { prisma } from "@/lib/prisma";
import { deleteImages, uploadImageFiles } from "@/lib/s3";

function formError(error: string, formData: FormData): ArticleFormState {
  return {
    error,
    values: {
      title: String(formData.get("title") ?? ""),
      author: String(formData.get("author") ?? ""),
      content: String(formData.get("content") ?? ""),
    },
  };
}

function parseArticleForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (title === "" || title.length > MAX_TITLE_LENGTH) {
    return `Enter a title up to ${MAX_TITLE_LENGTH} characters.`;
  }

  const author = String(formData.get("author") ?? "").trim();
  if (author === "" || author.length > MAX_AUTHOR_LENGTH) {
    return `Enter an author up to ${MAX_AUTHOR_LENGTH} characters.`;
  }

  const content = String(formData.get("content") ?? "").trim();
  if (content === "" || content.length > MAX_CONTENT_LENGTH) {
    return `Enter content up to ${MAX_CONTENT_LENGTH} characters.`;
  }

  const entry = formData.get("image");
  const image = entry instanceof File && entry.size > 0 ? entry : null;
  if (image) {
    const imageError = validateImageFiles([image]);
    if (imageError) {
      return imageError;
    }
  }

  return { title, author, content, image };
}

export async function createArticle(_state: ArticleFormState, formData: FormData) {
  await requireAdmin();

  const parsed = parseArticleForm(formData);
  if (typeof parsed === "string") {
    return formError(parsed, formData);
  }

  const { title, author, content, image } = parsed;
  if (!image) {
    return formError("Upload a hero image.", formData);
  }

  const [imageKey] = await uploadImageFiles([image], "articles");
  await prisma.article.create({ data: { title, author, content, image: imageKey } });

  redirect("/admin/articles");
}

export async function updateArticle(
  id: string,
  _state: ArticleFormState,
  formData: FormData,
) {
  await requireAdmin();

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    notFound();
  }

  const parsed = parseArticleForm(formData);
  if (typeof parsed === "string") {
    return formError(parsed, formData);
  }

  const { title, author, content, image } = parsed;

  let imageKey = article.image;
  if (image) {
    [imageKey] = await uploadImageFiles([image], "articles");
  }

  await prisma.article.update({ where: { id }, data: { title, author, content, image: imageKey } });
  if (imageKey !== article.image) {
    await deleteImages([article.image]);
  }

  redirect("/admin/articles");
}

export async function deleteArticle(id: string) {
  await requireAdmin();

  const article = await prisma.article.findUnique({ where: { id } });
  if (article) {
    await prisma.article.delete({ where: { id } });
    await deleteImages([article.image]);
  }

  redirect("/admin/articles");
}
