"use client";

import { useEffect, useRef } from "react";

const CALLBACK_NAME = "onTurnstileLoad";
const SCRIPT_SRC = `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=${CALLBACK_NAME}`;

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    [CALLBACK_NAME]?: () => void;
  }
}

// The script's load event fires before window.turnstile exists, so wait for the
// onload callback the loader calls instead.
let ready: Promise<void> | null = null;

function loadTurnstile() {
  if (!ready) {
    ready = new Promise<void>((resolve) => {
      window[CALLBACK_NAME] = resolve;
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    });
  }
  return ready;
}

// Tokens are single use, so the parent bumps resetSignal after a failed submit
// to hand the user a fresh one.
export function Turnstile({
  onToken,
  resetSignal,
}: {
  onToken: (token: string | null) => void;
  resetSignal: number;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      return;
    }

    let cancelled = false;

    loadTurnstile().then(() => {
      if (cancelled || !window.turnstile || !container.current || widgetId.current) {
        return;
      }

      widgetId.current = window.turnstile.render(container.current, {
        sitekey: siteKey,
        callback: (token: string) => onToken(token),
        "error-callback": () => onToken(null),
        "expired-callback": () => onToken(null),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [siteKey, onToken]);

  useEffect(() => {
    if (resetSignal === 0 || !widgetId.current || !window.turnstile) {
      return;
    }

    window.turnstile.reset(widgetId.current);
    onToken(null);
  }, [resetSignal, onToken]);

  if (!siteKey) {
    return <p className="text-sm text-danger">NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set.</p>;
  }

  return <div ref={container} />;
}
