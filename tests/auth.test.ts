import { describe, expect, it } from "vitest";

import { applyFailureToRateLimit, evaluateRateLimitState } from "../src/lib/admin-rate-limit";
import { buildSessionValue, isSessionValueValid } from "../src/lib/auth";

describe("session signing", () => {
  it("accepts unexpired signed session values", () => {
    const expiresAt = Date.now() + 60_000;
    const session = buildSessionValue("summer-2026", "pass-hash", expiresAt);

    expect(isSessionValueValid(session, "summer-2026", "pass-hash", expiresAt - 1)).toBe(true);
  });

  it("rejects expired session values", () => {
    const expiresAt = Date.now() + 60_000;
    const session = buildSessionValue("summer-2026", "pass-hash", expiresAt);

    expect(isSessionValueValid(session, "summer-2026", "pass-hash", expiresAt + 1)).toBe(false);
  });
});

describe("admin login rate limiting", () => {
  it("blocks requests after repeated failures", () => {
    let state = null;
    const now = Date.now();

    for (let index = 0; index < 5; index += 1) {
      state = applyFailureToRateLimit(state, now + index * 1_000);
    }

    const status = evaluateRateLimitState(state, now + 5_000);
    expect(status.allowed).toBe(false);
    expect(status.retryAfterSeconds).toBeGreaterThan(0);
  });
});
