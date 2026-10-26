import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __clearPassphraseOverrideForTests,
  buildAuthToken,
  checkPassphrase,
  isAuthedToken,
  setPassphrase,
} from "./auth";

beforeEach(() => {
  process.env.HOUSEKEEPING_PASSPHRASE = "test-passphrase";
  process.env.HOUSEKEEPING_TOKEN_SECRET = "test-secret";
});

afterEach(() => {
  __clearPassphraseOverrideForTests();
});

describe("checkPassphrase", () => {
  it("accepts the correct passphrase", async () => {
    expect(await checkPassphrase("test-passphrase")).toBe(true);
  });

  it("rejects an incorrect passphrase", async () => {
    expect(await checkPassphrase("wrong")).toBe(false);
  });
});

describe("setPassphrase", () => {
  it("overrides the env var once set, without touching the env var itself", async () => {
    await setPassphrase("rotated");
    expect(await checkPassphrase("test-passphrase")).toBe(false);
    expect(await checkPassphrase("rotated")).toBe(true);
    expect(process.env.HOUSEKEEPING_PASSPHRASE).toBe("test-passphrase");
  });

  it("rotating the passphrase invalidates tokens signed under the old one", async () => {
    const oldToken = await buildAuthToken();
    await setPassphrase("new-passphrase");
    expect(await isAuthedToken(oldToken)).toBe(false);
    const newToken = await buildAuthToken();
    expect(await isAuthedToken(newToken)).toBe(true);
  });
});

describe("buildAuthToken / isAuthedToken", () => {
  it("a freshly built token is valid", async () => {
    const token = await buildAuthToken();
    expect(await isAuthedToken(token)).toBe(true);
  });

  it("rejects a missing or malformed token", async () => {
    expect(await isAuthedToken(null)).toBe(false);
    expect(await isAuthedToken("garbage")).toBe(false);
    expect(await isAuthedToken("ok:notanumber.abcd")).toBe(false);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await buildAuthToken();
    process.env.HOUSEKEEPING_TOKEN_SECRET = "a-different-secret";
    expect(await isAuthedToken(token)).toBe(false);
  });

  it("rejects an expired token", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2020-01-01T00:00:00Z"));
      const token = await buildAuthToken();
      expect(await isAuthedToken(token)).toBe(true);

      vi.setSystemTime(new Date("2020-01-02T00:00:00Z"));
      expect(await isAuthedToken(token)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
