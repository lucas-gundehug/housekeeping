// Central place to react to a token no longer being valid — an expired
// 12h session, or one invalidated by rotating the Housekeeping passphrase
// (see src/lib/auth.ts) — no matter which client module happens to be
// making the call. AuthProvider (auth-context.tsx) registers its own
// logout() here once, at the root of the app.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function authedFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401) onUnauthorized?.();
  return res;
}
