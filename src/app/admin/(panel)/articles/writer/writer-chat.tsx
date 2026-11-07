"use client";

import { useEffect, useRef } from "react";
import { CHAT_MODELS, parseDraft } from "@/lib/chat";
import { useChat } from "./use-chat";

export type Draft = { title: string; content: string };

const PROMPTS = [
  "I want a piece on why people keep a sigil they cannot read.",
  "Draft it.",
  "Shorter, and end on the question instead of answering it.",
];

export function WriterChat({ onUseDraft }: { onUseDraft: (draft: Draft) => void }) {
  const chat = useChat();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [chat.turns, chat.streaming]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {chat.turns.length === 0 && (
          <div className="card space-y-2 p-4 text-muted">
            <p>
              Describe the piece you want. Every article you have published travels with the
              conversation, so the draft comes back in the same voice.
            </p>
            {PROMPTS.map((prompt) => (
              <p key={prompt} className="text-sm">
                &ldquo;{prompt}&rdquo;
              </p>
            ))}
          </div>
        )}

        {chat.turns.map((turn, index) => {
          const parsed = turn.role === "assistant" ? parseDraft(turn.content) : null;
          const last = index === chat.turns.length - 1;

          return (
            <div
              key={index}
              className={
                turn.role === "user" ? "card max-w-[85%] self-end p-4" : "card max-w-[95%] p-4"
              }
            >
              <p className="mb-1 text-xs tracking-[0.15em] text-muted uppercase">
                {turn.role === "user" ? "You" : parsed ? "Draft" : "Claude"}
              </p>

              {parsed ? (
                <>
                  <p className="title text-lg">{parsed.title}</p>
                  <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {parsed.content}
                  </p>
                  <button
                    onClick={() => onUseDraft(parsed)}
                    // Mid-stream the draft is still arriving, so loading it
                    // into the form would only put half an article there.
                    disabled={last && chat.streaming}
                    className="btn mt-3"
                  >
                    Use this draft
                  </button>
                </>
              ) : (
                <p className="whitespace-pre-wrap">{turn.content}</p>
              )}
            </div>
          );
        })}

        {chat.waiting && <p className="text-muted">Writing...</p>}
        {chat.error && <p className="text-sm text-danger">Could not answer: {chat.error}</p>}
        <div ref={endRef} />
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          value={chat.draft}
          onChange={(event) => chat.changeDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              chat.send();
            }
          }}
          placeholder="Tell it what the piece should be..."
          rows={3}
          className="field resize-y"
          disabled={chat.streaming}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={chat.send}
            className="btn btn-primary"
            disabled={chat.streaming || !chat.draft.trim()}
          >
            {chat.streaming ? "Writing..." : "Send"}
          </button>
          <label className="flex items-center gap-2 text-sm text-muted">
            Model
            <select
              value={chat.modelId}
              onChange={(event) => chat.chooseModel(event.target.value)}
              disabled={chat.streaming}
              className="field py-1"
            >
              {CHAT_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {`${model.label} - ${model.price}`}
                </option>
              ))}
            </select>
          </label>
          {chat.turns.length > 0 && (
            <button
              onClick={chat.reset}
              disabled={chat.streaming}
              className="link text-sm text-muted"
            >
              Start over
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
