"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [error, formAction, pending] = useActionState(login, null);

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      <h1 className="title text-2xl">Admin log in</h1>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="field"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="field"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full"
      >
        {pending ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
