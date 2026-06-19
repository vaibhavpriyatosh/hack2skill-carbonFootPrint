import { describe, it, expect } from "vitest";
import { authConfig } from "./auth.config";

/**
 * Tests for the authorized() callback in auth.config.ts.
 * We invoke the callback directly with mock auth/request objects.
 */

function makeNextUrl(pathname: string) {
  return new URL(`http://localhost:3000${pathname}`);
}

function callAuthorized(pathname: string, isLoggedIn: boolean) {
  const auth = isLoggedIn ? { user: { id: "1", name: "Test" } } : null;
  const nextUrl = makeNextUrl(pathname);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (authConfig.callbacks.authorized as any)({
    auth,
    request: { nextUrl },
  });
}

describe("Auth Config — authorized callback", () => {
  // ─── Unauthenticated users ─────────────────────────────────────────────
  describe("unauthenticated users", () => {
    it("should allow access to /login", () => {
      const result = callAuthorized("/login", false);
      expect(result).toBe(true);
    });

    it("should allow access to /signup", () => {
      const result = callAuthorized("/signup", false);
      expect(result).toBe(true);
    });

    it("should deny access to / (marketing page)", () => {
      const result = callAuthorized("/", false);
      expect(result).toBe(false);
    });

    it("should deny access to /dashboard", () => {
      const result = callAuthorized("/dashboard", false);
      expect(result).toBe(false);
    });

    it("should deny access to /assessment", () => {
      const result = callAuthorized("/assessment", false);
      expect(result).toBe(false);
    });

    it("should deny access to /settings", () => {
      const result = callAuthorized("/settings", false);
      expect(result).toBe(false);
    });

    it("should deny access to any arbitrary route", () => {
      expect(callAuthorized("/some-random-page", false)).toBe(false);
      expect(callAuthorized("/admin", false)).toBe(false);
      expect(callAuthorized("/profile/edit", false)).toBe(false);
    });
  });

  // ─── Authenticated users ───────────────────────────────────────────────
  describe("authenticated users", () => {
    it("should redirect from /login to /dashboard", () => {
      const result = callAuthorized("/login", true);
      expect(result).toBeInstanceOf(Response);
      const response = result as Response;
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toContain("/dashboard");
    });

    it("should redirect from /signup to /dashboard", () => {
      const result = callAuthorized("/signup", true);
      expect(result).toBeInstanceOf(Response);
      const response = result as Response;
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toContain("/dashboard");
    });

    it("should allow access to /dashboard", () => {
      const result = callAuthorized("/dashboard", true);
      expect(result).toBe(true);
    });

    it("should allow access to /assessment", () => {
      const result = callAuthorized("/assessment", true);
      expect(result).toBe(true);
    });

    it("should allow access to / (marketing page)", () => {
      const result = callAuthorized("/", true);
      expect(result).toBe(true);
    });

    it("should allow access to any non-auth route", () => {
      expect(callAuthorized("/settings", true)).toBe(true);
      expect(callAuthorized("/profile", true)).toBe(true);
      expect(callAuthorized("/some-page", true)).toBe(true);
    });
  });
});
