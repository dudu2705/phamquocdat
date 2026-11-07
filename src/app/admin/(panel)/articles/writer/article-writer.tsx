"use client";

import { useState } from "react";
import { ArticleForm } from "../article-form";
import { type Draft, WriterChat } from "./writer-chat";

export function ArticleWriter() {
  const [draft, setDraft] = useState<Draft | null>(null);
  // The form takes its values as defaults, so loading a second draft has to
  // remount it. Counting the drafts gives it a key that changes each time.
  const [loaded, setLoaded] = useState(0);

  function useDraft(next: Draft) {
    setDraft(next);
    setLoaded((count) => count + 1);
  }

  return (
    <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-2">
      <section className="flex min-h-[32rem] flex-col gap-3 lg:h-[calc(100vh-14rem)] lg:sticky lg:top-8">
        <h1 className="title text-2xl">Write with Claude</h1>
        <WriterChat onUseDraft={useDraft} />
      </section>

      <section>
        {/* Still the ordinary create form: the hero image and the author are
            Dat's to fill in, and saving goes through the same server action. */}
        <ArticleForm key={loaded} draft={draft ?? undefined} />
      </section>
    </div>
  );
}
