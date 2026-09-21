"use client";

import { useActionState } from "react";
import Image from "next/image";
import { createArticle, updateArticle } from "../../article-actions";
import {
  MAX_AUTHOR_LENGTH,
  MAX_CONTENT_LENGTH,
  MAX_TITLE_LENGTH,
} from "@/lib/articles";
import { IMAGE_EXTENSIONS, MAX_IMAGE_BYTES } from "@/lib/images";

type ArticleFormProps = {
  article?: {
    id: string;
    title: string;
    author: string;
    content: string;
    imageUrl: string;
  };
};

export function ArticleForm({ article }: ArticleFormProps) {
  const [state, formAction, pending] = useActionState(
    article ? updateArticle.bind(null, article.id) : createArticle,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <h1 className="title text-2xl">{article ? "Edit article" : "Add article"}</h1>

      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={MAX_TITLE_LENGTH}
          defaultValue={state?.values.title ?? article?.title}
          className="field"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="author" className="text-sm font-medium">
          Author
        </label>
        <input
          id="author"
          name="author"
          type="text"
          required
          maxLength={MAX_AUTHOR_LENGTH}
          defaultValue={state?.values.author ?? article?.author}
          className="field"
        />
      </div>

      {article && (
        <Image
          src={article.imageUrl}
          alt=""
          width={600}
          height={338}
          unoptimized
          className="aspect-video w-full border object-cover"
        />
      )}

      <div className="space-y-1">
        <label htmlFor="image" className="text-sm font-medium">
          {article ? "Replace hero image" : "Hero image"}
        </label>
        <input
          id="image"
          name="image"
          type="file"
          required={!article}
          accept={Object.keys(IMAGE_EXTENSIONS).join(",")}
          className="field"
        />
        <p className="text-xs text-muted">
          {article ? "Leave empty to keep the current image. " : ""}
          {MAX_IMAGE_BYTES / 1024 / 1024}MB max.
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="content" className="text-sm font-medium">
          Content
        </label>
        <textarea
          id="content"
          name="content"
          rows={14}
          required
          maxLength={MAX_CONTENT_LENGTH}
          defaultValue={state?.values.content ?? article?.content}
          className="field"
        />
      </div>

      {state && <p className="text-sm text-danger">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Saving..." : "Save article"}
      </button>
    </form>
  );
}
