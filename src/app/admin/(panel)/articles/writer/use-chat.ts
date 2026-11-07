"use client";

import { useEffect, useState } from "react";
import { ChatTurn, DEFAULT_MODEL, MAX_MESSAGE_CHARS, MAX_TURNS } from "@/lib/chat";

const MODEL_KEY = "dats-world:writer-model";

// Async, and read after mount: localStorage does not exist while rendering on
// the server, and reading it during render would make the two disagree.
async function storedModel() {
  try {
    return localStorage.getItem(MODEL_KEY) ?? DEFAULT_MODEL.id;
  } catch {
    return DEFAULT_MODEL.id;
  }
}

// One drafting conversation, streamed from /api/admin/chat.
export function useChat() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelId, setModelId] = useState(DEFAULT_MODEL.id);

  useEffect(() => {
    storedModel().then(setModelId);
  }, []);

  function chooseModel(id: string) {
    setModelId(id);
    try {
      localStorage.setItem(MODEL_KEY, id);
    } catch {
      // Remembering the choice is a convenience; the writer works without it.
    }
  }

  function reset() {
    setTurns([]);
    setError(null);
  }

  function changeDraft(value: string) {
    setDraft(value.slice(0, MAX_MESSAGE_CHARS));
  }

  async function send() {
    const message = draft.trim();
    if (!message || streaming) return;

    // The oldest turns fall off rather than the newest: the published articles
    // are the context that matters, and the whole conversation travels every
    // request.
    const history = [...turns, { role: "user" as const, content: message }].slice(-MAX_TURNS);

    setTurns(history);
    setDraft("");
    setError(null);
    setStreaming(true);

    try {
      const response = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, model: modelId }),
      });

      if (!response.ok || !response.body) {
        setError(await response.text().catch(() => "The request failed."));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      setTurns([...history, { role: "assistant", content: "" }]);

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setTurns([...history, { role: "assistant", content: answer }]);
      }
    } catch {
      setError("Lost the connection before the draft finished.");
    } finally {
      setStreaming(false);
    }
  }

  return {
    turns,
    draft,
    changeDraft,
    streaming,
    error,
    modelId,
    chooseModel,
    send,
    reset,
    waiting: streaming && turns[turns.length - 1]?.role === "user",
  };
}
