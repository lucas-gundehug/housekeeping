// Brute-force deterrent for the passphrase. In-memory only for now (no
// Upstash Redis wired up yet) — this only protects one warm serverless
// instance and resets on cold starts, which is an acceptable v1 tradeoff
// given the passphrase itself is a real high-entropy secret, not a 4-digit
// PIN. Revisit if this ever needs to be durable across instances.
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 10 * 60;

const memoryAttempts = new Map<
  string,
  { count: number; lockedUntil: number }
>();

export function isLockedOut(key: string): boolean {
  const entry = memoryAttempts.get(key);
  return entry != null && entry.lockedUntil > Date.now();
}

export function recordFailedAttempt(key: string): void {
  const entry = memoryAttempts.get(key) ?? { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_SECONDS * 1000;
    entry.count = 0;
  }
  memoryAttempts.set(key, entry);
}

export function clearAttempts(key: string): void {
  memoryAttempts.delete(key);
}

export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
