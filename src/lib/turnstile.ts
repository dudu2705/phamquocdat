const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Fails closed: a missing secret means no registration rather than an open form.
export async function verifyTurnstile(token: unknown, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not set, rejecting the registration");
    return false;
  }

  if (typeof token !== "string" || token === "") {
    return false;
  }

  const body = new URLSearchParams({ secret, response: token });
  if (ip) {
    body.set("remoteip", ip);
  }

  try {
    const response = await fetch(VERIFY_URL, { method: "POST", body });
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error("Could not reach the Turnstile verify endpoint", error);
    return false;
  }
}
