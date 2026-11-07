import Anthropic from "@anthropic-ai/sdk";
import {
  CHAT_EFFORT,
  CHAT_MAX_TOKENS,
  ChatTurn,
  MAX_MESSAGE_CHARS,
  MAX_TURNS,
  publishedArticlesAsText,
  resolveModel,
  systemPreamble,
} from "@/lib/chat";
import { getAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function parseTurns(value: unknown): ChatTurn[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_TURNS) {
    return null;
  }

  const turns: ChatTurn[] = [];
  for (const item of value) {
    const role = (item as ChatTurn)?.role;
    const content = (item as ChatTurn)?.content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || content.length === 0) return null;
    if (content.length > MAX_MESSAGE_CHARS) return null;
    turns.push({ role, content });
  }

  if (turns[0].role !== "user") return null;
  if (turns[turns.length - 1].role !== "user") return null;
  return turns;
}

export async function POST(request: Request) {
  // getAdmin rather than requireAdmin: a route handler answers 401, it does
  // not redirect a fetch to the login page.
  if (!(await getAdmin())) {
    return new Response("Not signed in as an admin.", { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY is not set on the server.", { status: 503 });
  }

  const payload = await request.json().catch(() => null);
  const turns = parseTurns(payload?.messages);
  if (!turns) {
    return new Response("Bad request.", { status: 400 });
  }

  // Anything the browser sends that is not on the allowlist falls back to the
  // default rather than reaching the API.
  const model = resolveModel(payload?.model);

  const articles = await prisma.article.findMany({
    select: { title: true, author: true, content: true, createdAt: true },
  });

  // Date only, never a timestamp: a value that changed every request would
  // invalidate the cached prefix on every message.
  const today = new Date().toISOString().slice(0, 10);

  const client = new Anthropic();

  const stream = client.beta.messages.stream({
    model: model.id,
    max_tokens: CHAT_MAX_TOKENS,
    output_config: { effort: CHAT_EFFORT },
    // These models can decline a request outright; where a fallback exists the
    // API re-runs the turn on it instead of the answer simply stopping.
    ...(model.refusalFallback
      ? {
          betas: ["server-side-fallback-2026-06-01" as const],
          fallbacks: [{ model: model.refusalFallback }],
        }
      : {}),
    system: [
      { type: "text", text: systemPreamble(today, articles.length) },
      {
        type: "text",
        text: publishedArticlesAsText(articles),
        // One breakpoint at the end of the system prefix, so the preamble and
        // every published article are read from cache on later messages.
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: turns,
  });

  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        // Token counts only, no draft text. A cache_read of roughly the
        // published articles' size is the signal that the prefix is cached.
        const final = await stream.finalMessage();
        const used = final.usage;
        console.log(
          `[writer] model=${final.model} in=${used.input_tokens} ` +
            `cache_write=${used.cache_creation_input_tokens ?? 0} ` +
            `cache_read=${used.cache_read_input_tokens ?? 0} ` +
            `out=${used.output_tokens} stop=${final.stop_reason}`,
        );

        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\n[Claude declined to write that one.]"));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("\n\n[Cut off at the length limit.]"));
        }
        controller.close();
      } catch (error) {
        const message =
          error instanceof Anthropic.AuthenticationError
            ? "The Anthropic API key was rejected."
            : error instanceof Anthropic.RateLimitError
              ? "Rate limited by the API. Try again in a moment."
              : error instanceof Anthropic.APIError
                ? `The API returned an error (${error.status}).`
                : "Something went wrong talking to the API.";
        controller.enqueue(encoder.encode(`\n\n[${message}]`));
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      // A proxy that buffers responses would hold the whole answer back until
      // it finished; this turns that buffering off for this route.
      "X-Accel-Buffering": "no",
    },
  });
}
