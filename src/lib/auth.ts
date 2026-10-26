// This tool holds service-role (RLS-bypassing) access to the personal
// dashboard's database — more powerful than the dashboard's own 4-digit
// login — so unlike the 4-digit-code pattern used elsewhere,
// both HOUSEKEEPING_PASSPHRASE and HOUSEKEEPING_TOKEN_SECRET are required
// with no insecure fallback: if either is unset, auth fails closed instead
// of silently working with a guessable default.
//
// Same signed-token shape as the other apps (see personal-dashboard's
// auth.ts) — a payload of "ok:<expiry>" plus an HMAC signature — but a
// shorter TTL given the blast radius of a leaked token here, and the
// passphrase is expected to be a real, high-entropy passphrase rather than
// a 4-digit PIN.
//
// HOUSEKEEPING_PASSPHRASE is only the initial value — the passphrase can be
// changed at runtime from the Admin tab (see change-passphrase.ts) without a
// redeploy. A changed passphrase is stored in Redis (or in-memory without
// Redis configured) and takes priority over the env var whenever present
// (the same override pattern as personal-dashboard's access code).

import { redis } from "@/lib/redis";

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

const PASSPHRASE_OVERRIDE_KEY = "housekeeping:passphrase-override";
let memoryPassphraseOverride: string | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set — refusing to start auth without it`);
  }
  return value;
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Fails closed the same way the old env-only version did: if neither a
// Redis/in-memory override nor the env var is set, there's no safe default
// to fall back to.
async function getPassphrase(): Promise<string> {
  if (redis) {
    const stored = await redis.get<string>(PASSPHRASE_OVERRIDE_KEY);
    if (stored) return stored;
  } else if (memoryPassphraseOverride) {
    return memoryPassphraseOverride;
  }
  return requireEnv("HOUSEKEEPING_PASSPHRASE");
}

export async function setPassphrase(newPassphrase: string): Promise<void> {
  if (redis) await redis.set(PASSPHRASE_OVERRIDE_KEY, newPassphrase);
  else memoryPassphraseOverride = newPassphrase;
}

// Test-only: the in-memory override otherwise leaks a changed passphrase
// across test cases within the same file run (Redis is unconfigured in
// tests, so every setPassphrase call lands here).
export function __clearPassphraseOverrideForTests(): void {
  memoryPassphraseOverride = null;
}

async function getTokenKeyMaterial() {
  return `${requireEnv("HOUSEKEEPING_TOKEN_SECRET")}:${await getPassphrase()}`;
}

async function hmac(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(await getTokenKeyMaterial()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function checkPassphrase(passphrase: string): Promise<boolean> {
  return constantTimeEqual(passphrase, await getPassphrase());
}

export async function buildAuthToken() {
  const payload = `ok:${Date.now() + TOKEN_TTL_MS}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function isAuthedToken(token: string | null | undefined) {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const match = payload.match(/^ok:(\d+)$/);
  if (!match) return false;
  if (Date.now() > Number(match[1])) return false;
  const expected = await hmac(payload);
  return constantTimeEqual(sig, expected);
}

export function tokenFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}
