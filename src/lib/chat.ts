import { MAX_CONTENT_LENGTH, MAX_TITLE_LENGTH } from "./articles";

// The models the browser may ask for. The id it sends is matched against this
// list and nothing else, so the picker cannot be used to reach an arbitrary or
// more expensive model.
//
// Thinking is on and cannot be turned off on any of the three, so depth is set
// with effort alone. refusalFallback is per model on purpose: Haiku 5.5 has no
// server-side fallback, and Sonnet 5.5 does not take the list form Opus takes.
export type ChatModel = {
  id: string;
  label: string;
  price: string;
  refusalFallback: string | null;
};

export const CHAT_MODELS: ChatModel[] = [
  {
    id: "claude-opus-5-5",
    label: "Opus 5.5",
    price: "best writing",
    refusalFallback: "claude-opus-4-8",
  },
  {
    id: "claude-sonnet-5-5",
    label: "Sonnet 5.5",
    price: "half the price of Opus",
    refusalFallback: null,
  },
  {
    id: "claude-haiku-5-5",
    label: "Haiku 5.5",
    price: "cheapest",
    refusalFallback: null,
  },
];

export const DEFAULT_MODEL = CHAT_MODELS[0];

export function resolveModel(id: unknown): ChatModel {
  return CHAT_MODELS.find((model) => model.id === id) ?? DEFAULT_MODEL;
}

export const CHAT_EFFORT = "medium";

// Room for a full article and then some: the longest draft the form will take
// is MAX_CONTENT_LENGTH characters, roughly 6k tokens.
export const CHAT_MAX_TOKENS = 16000;

// How much of the conversation travels with each request.
export const MAX_TURNS = 40;
export const MAX_MESSAGE_CHARS = 8000;

export type ChatTurn = { role: "user" | "assistant"; content: string };

// The first line of a draft. Everything after it is the article body, which is
// what lets the panel lift a reply straight into the article form.
export const DRAFT_MARKER = "TITLE:";

export function parseDraft(text: string) {
  const match = /^TITLE:[ \t]*(.+)\n([\s\S]+)$/.exec(text.trim());
  if (!match) {
    return null;
  }

  const title = match[1].trim();
  const content = match[2].trim();
  if (title === "" || content === "") {
    return null;
  }

  return {
    title: title.slice(0, MAX_TITLE_LENGTH),
    content: content.slice(0, MAX_CONTENT_LENGTH),
  };
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export type ChatArticle = {
  title: string;
  author: string;
  content: string;
  createdAt: Date;
};

// Oldest first, so the block stays byte-identical between requests as long as
// nothing is published or edited — that is what keeps the cached prefix alive.
export function publishedArticlesAsText(articles: ChatArticle[]) {
  if (articles.length === 0) {
    return "<published>\nNothing has been published yet, so there is no house voice to match. Write plainly and let Dat steer.\n</published>";
  }

  const blocks = [...articles]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map(
      (article) =>
        `<article title="${escapeAttribute(article.title)}" author="${escapeAttribute(article.author)}" ` +
        `date="${article.createdAt.toISOString().slice(0, 10)}">\n${article.content}\n</article>`,
    );

  return ["<published>", blocks.join("\n\n"), "</published>"].join("\n");
}

export function systemPreamble(today: string, articleCount: number) {
  return `You write with Dat on Dat's World, a small site whose articles are published under the name Esoteric Knowledge. Dat brings the idea; you turn it into a finished article in the site's own voice.

Every article published so far is below — ${articleCount} of them, in full. They are the house voice: read them for register, length, how a piece opens and how it ends. Today is ${today}.

Two kinds of reply, and nothing in between:

1. Talking it through. When Dat is still shaping the idea, or asks a question, or wants a few angles, reply in plain prose. Be a writer thinking out loud with him, not a consultant: no bullet-point plans unless he asks for one, no praise for the idea, no closing offer of further help. Where the idea is thin, say what is missing and ask the one question that would unlock it.

2. A draft. When Dat asks for a draft, a rewrite, or a new version, reply with the article and nothing else — no preamble, no commentary, no sign-off. Use exactly this shape:

${DRAFT_MARKER} the title of the piece
(a blank line)
the body of the article

The site renders the body as plain text, so markdown does not format: asterisks, hashes and backticks show up as themselves. Separate paragraphs with a blank line, write no headings, and use no link syntax. Keep it under ${MAX_CONTENT_LENGTH} characters.

How the writing should read:
- Match the published articles in voice and length. If Dat asks for something outside that range, follow Dat.
- Dat writes in English and Vietnamese. Draft in whichever language he asks in, and talk in whichever language he uses.
- Concrete over grand. The subject is esoteric; the prose does not have to be. Prefer a plain sentence that says something to an ornate one that does not.
- Invent nothing that pretends to be fact: no made-up sources, citations, dates, translations or historical claims. Write what the tradition holds as what it holds. If Dat asks for a factual detail you are unsure of, say so in the draft or leave it for him to fill.
- Never promise anything about the shop, its products, prices or delivery in an article.`;
}
