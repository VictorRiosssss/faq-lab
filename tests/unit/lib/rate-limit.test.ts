import { describe, expect, it } from "vitest";
import { isRateLimited, recordFailedAttempt, clearRateLimit } from "@/lib/rate-limit";

describe("rate-limit", () => {
  it("does not limit a key with no recorded failures", () => {
    const key = `test-${Math.random()}`;
    const result = isRateLimited(key, { limit: 3 });
    expect(result.limited).toBe(false);
  });

  it("does not limit while under the failure limit", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 2; i++) {
      recordFailedAttempt(key, 60_000);
    }
    const result = isRateLimited(key, { limit: 3 });
    expect(result.limited).toBe(false);
  });

  it("limits once the recorded failures reach the limit", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(key, 60_000);
    }
    const result = isRateLimited(key, { limit: 5 });
    expect(result.limited).toBe(true);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("does not count a successful login toward the limit", () => {
    // Simulates 4 failed attempts followed by a successful one that clears
    // the bucket — a 5th failed attempt right after should not be limited.
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 4; i++) {
      recordFailedAttempt(key, 60_000);
    }
    clearRateLimit(key);
    const result = isRateLimited(key, { limit: 5 });
    expect(result.limited).toBe(false);
  });

  it("resets after the window passes", async () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(key, 5);
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
    const result = isRateLimited(key, { limit: 5 });
    expect(result.limited).toBe(false);
  });

  it("tracks separate keys independently", () => {
    const keyA = `a-${Math.random()}`;
    const keyB = `b-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(keyA, 60_000);
    }
    expect(isRateLimited(keyA, { limit: 5 }).limited).toBe(true);
    expect(isRateLimited(keyB, { limit: 5 }).limited).toBe(false);
  });
});
