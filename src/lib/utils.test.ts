import { describe, it, expect } from "vitest";
import { cn, formatEmissions, formatPercentage, getCategoryColor, sleep } from "./utils";

describe("Utility Functions", () => {
  // ─── cn (class name merger) ──────────────────────────────────────────────
  describe("cn", () => {
    it("should merge simple class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("should handle conditional classes", () => {
      const result = cn("base", true && "active", false && "hidden");
      expect(result).toContain("base");
      expect(result).toContain("active");
      expect(result).not.toContain("hidden");
    });

    it("should resolve Tailwind conflicts", () => {
      // tailwind-merge should pick the last conflicting class
      const result = cn("p-4", "p-2");
      expect(result).toBe("p-2");
    });

    it("should handle empty inputs", () => {
      expect(cn()).toBe("");
      expect(cn("")).toBe("");
    });

    it("should handle undefined and null", () => {
      expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
    });

    it("should handle array inputs", () => {
      expect(cn(["foo", "bar"])).toBe("foo bar");
    });
  });

  // ─── formatEmissions ─────────────────────────────────────────────────────
  describe("formatEmissions", () => {
    it("should format values under 1000 as kg", () => {
      expect(formatEmissions(500)).toBe("500 kg CO₂e");
    });

    it("should format values at 1000+ as tonnes", () => {
      expect(formatEmissions(1000)).toBe("1.0 tonnes CO₂e");
    });

    it("should round kg values to nearest integer", () => {
      expect(formatEmissions(499.7)).toBe("500 kg CO₂e");
      expect(formatEmissions(123.4)).toBe("123 kg CO₂e");
    });

    it("should format tonnes with one decimal place", () => {
      expect(formatEmissions(1500)).toBe("1.5 tonnes CO₂e");
      expect(formatEmissions(12345)).toBe("12.3 tonnes CO₂e");
    });

    it("should handle zero", () => {
      expect(formatEmissions(0)).toBe("0 kg CO₂e");
    });

    it("should handle very small values", () => {
      expect(formatEmissions(0.1)).toBe("0 kg CO₂e");
    });

    it("should handle very large values", () => {
      expect(formatEmissions(100000)).toBe("100.0 tonnes CO₂e");
    });
  });

  // ─── formatPercentage ────────────────────────────────────────────────────
  describe("formatPercentage", () => {
    it("should format with default 1 decimal", () => {
      expect(formatPercentage(50)).toBe("50.0%");
    });

    it("should respect custom decimal places", () => {
      expect(formatPercentage(33.333, 2)).toBe("33.33%");
      expect(formatPercentage(100, 0)).toBe("100%");
    });

    it("should handle zero", () => {
      expect(formatPercentage(0)).toBe("0.0%");
    });

    it("should handle values over 100", () => {
      expect(formatPercentage(150.5, 1)).toBe("150.5%");
    });

    it("should handle negative values", () => {
      expect(formatPercentage(-5.5, 1)).toBe("-5.5%");
    });
  });

  // ─── getCategoryColor ────────────────────────────────────────────────────
  describe("getCategoryColor", () => {
    it("should return specific colors for known categories", () => {
      expect(getCategoryColor("TRANSPORT")).toBe("hsl(220, 70%, 55%)");
      expect(getCategoryColor("FOOD")).toBe("hsl(145, 60%, 45%)");
      expect(getCategoryColor("ENERGY")).toBe("hsl(35, 85%, 55%)");
      expect(getCategoryColor("SHOPPING")).toBe("hsl(280, 60%, 55%)");
      expect(getCategoryColor("DIGITAL")).toBe("hsl(190, 70%, 50%)");
    });

    it("should return fallback gray for unknown categories", () => {
      expect(getCategoryColor("UNKNOWN")).toBe("hsl(0, 0%, 60%)");
      expect(getCategoryColor("")).toBe("hsl(0, 0%, 60%)");
    });
  });

  // ─── sleep ───────────────────────────────────────────────────────────────
  describe("sleep", () => {
    it("should resolve after specified duration", async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      // Allow some tolerance for timer resolution
      expect(elapsed).toBeGreaterThanOrEqual(40);
      expect(elapsed).toBeLessThan(200);
    });

    it("should return void", async () => {
      const result = await sleep(0);
      expect(result).toBeUndefined();
    });
  });
});
