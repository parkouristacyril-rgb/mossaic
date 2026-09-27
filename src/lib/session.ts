import { env } from "@/lib/env";

/**
 * Stateless, signed session tokens. The token is `payload.signature`, where the
 * signature is an HMAC-SHA256 over the payload keyed by AUTH_SECRET. A tampered
 * payload (different org, elevated role, extended expiry) fails verification, so
 * the cookie can be trusted without a database round-trip.
 *
 * Everything here uses Web Crypto (`crypto.subtle`) and no Node built-ins, so it
 * runs unchanged in the Edge middleware and in Node route handlers.
 */

export const SESSION_COOKIE = "mossaic_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

export type SessionRole = "ADMIN" | "CONTRIBUTOR" | "VIEWER";

export type SessionPayload = {
  memberId: string;
  organizationId: string;
  role: SessionRole;
  email: string;
  name: string;
  /** Organization display name, cached here so the shell needs no extra fetch. */
  orgName: string;
  /** Expiry, unix seconds. */
  exp: number;
};

function bytesToB64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(input: string): Uint8Array<ArrayBuffer> {
  const b64 =
    input.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (input.length % 4)) % 4);
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

let keyPromise: Promise<CryptoKey> | null = null;
function hmacKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    keyPromise = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(env.authSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
  }
  return keyPromise;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const payloadPart = bytesToB64url(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(),
    new TextEncoder().encode(payloadPart),
  );
  return `${payloadPart}.${bytesToB64url(new Uint8Array(sig))}`;
}

export async function verifySession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const payloadPart = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);

  let valid = false;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      b64urlToBytes(sigPart),
      new TextEncoder().encode(payloadPart),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(b64urlToBytes(payloadPart)),
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
