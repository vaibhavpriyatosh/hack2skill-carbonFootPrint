import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { checkRateLimit, RATE_LIMITS } from "./rate-limit";

describe("Rate Limiter", () => {
  beforeEach(() => {
    // Reset the internal rate limit map between tests by exhausting + waiting
    // We use fake timers to control time precisely
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow the first request", () => {
    const result = checkRateLimit("test-user-first", { maxRequests: 5, windowSeconds: 60 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("should decrement remaining count on each request", () => {
    const config = { maxRequests: 3, windowSeconds: 60 };
    const r1 = checkRateLimit("test-user-decrement", config);
    const r2 = checkRateLimit("test-user-decrement", config);
    const r3 = checkRateLimit("test-user-decrement", config);

    expect(r1.remaining).toBe(2);
    expect(r2.remaining).toBe(1);
    expect(r3.remaining).toBe(0);
  });

  it("should deny requests after limit is reached", () => {
    const config = { maxRequests: 2, windowSeconds: 60 };
    checkRateLimit("test-user-deny", config);
    checkRateLimit("test-user-deny", config);
    const r3 = checkRateLimit("test-user-deny", config);

    expect(r3.success).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("should reset after the window expires", () => {
    const config = { maxRequests: 1, windowSeconds: 10 };
    const r1 = checkRateLimit("test-user-reset", config);
    expect(r1.success).toBe(true);

    const r2 = checkRateLimit("test-user-reset", config);
    expect(r2.success).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(11_000);

    const r3 = checkRateLimit("test-user-reset", config);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("should track different identifiers independently", () => {
    const config = { maxRequests: 1, windowSeconds: 60 };
    const r1 = checkRateLimit("user-a", config);
    const r2 = checkRateLimit("user-b", config);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);

    const r3 = checkRateLimit("user-a", config);
    expect(r3.success).toBe(false);

    const r4 = checkRateLimit("user-b", config);
    expect(r4.success).toBe(false);
  });

  it("should include a valid resetAt timestamp", () => {
    const now = Date.now();
    const config = { maxRequests: 5, windowSeconds: 60 };
    const result = checkRateLimit("test-user-reset-at", config);

    expect(result.resetAt).toBeGreaterThanOrEqual(now);
    expect(result.resetAt).toBeLessThanOrEqual(now + 60_000 + 100); // small tolerance
  });

  it("should return consistent resetAt within the same window", () => {
    const config = { maxRequests: 5, windowSeconds: 60 };
    const r1 = checkRateLimit("test-user-consistent", config);
    vi.advanceTimersByTime(1000);
    const r2 = checkRateLimit("test-user-consistent", config);

    expect(r1.resetAt).toBe(r2.resetAt);
  });

  // ─── Preset Rate Limits ──────────────────────────────────────────────────
  describe("RATE_LIMITS presets", () => {
    it("should have auth preset with 5 requests / 60 seconds", () => {
      expect(RATE_LIMITS.auth).toEqual({ maxRequests: 5, windowSeconds: 60 });
    });

    it("should have api preset with 30 requests / 60 seconds", () => {
      expect(RATE_LIMITS.api).toEqual({ maxRequests: 30, windowSeconds: 60 });
    });

    it("should have ai preset with 10 requests / 60 seconds", () => {
      expect(RATE_LIMITS.ai).toEqual({ maxRequests: 10, windowSeconds: 60 });
    });
  });

  // ─── Edge Cases ──────────────────────────────────────────────────────────
  describe("Edge Cases", () => {
    it("should handle max 1 request limit", () => {
      const config = { maxRequests: 1, windowSeconds: 1 };
      const r1 = checkRateLimit("single-req", config);
      expect(r1.success).toBe(true);
      expect(r1.remaining).toBe(0);

      const r2 = checkRateLimit("single-req", config);
      expect(r2.success).toBe(false);
    });

    it("should handle rapid-fire requests", () => {
      const config = { maxRequests: 100, windowSeconds: 60 };
      let lastResult;
      for (let i = 0; i < 100; i++) {
        lastResult = checkRateLimit("rapid-fire", config);
      }
      expect(lastResult!.success).toBe(true);
      expect(lastResult!.remaining).toBe(0);

      const overflow = checkRateLimit("rapid-fire", config);
      expect(overflow.success).toBe(false);
    });
  });
});
