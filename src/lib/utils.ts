import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with proper conflict resolution.
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as kg CO2e with appropriate units.
 */
export function formatEmissions(kgCO2: number): string {
  if (kgCO2 >= 1000) {
    return `${(kgCO2 / 1000).toFixed(1)} tonnes CO₂e`;
  }
  return `${Math.round(kgCO2)} kg CO₂e`;
}

/**
 * Formats a number as a percentage with optional decimal places.
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Generates a consistent color for each carbon category.
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    TRANSPORT: "hsl(220, 70%, 55%)",
    FOOD: "hsl(145, 60%, 45%)",
    ENERGY: "hsl(35, 85%, 55%)",
    SHOPPING: "hsl(280, 60%, 55%)",
    DIGITAL: "hsl(190, 70%, 50%)",
  };
  return colors[category] ?? "hsl(0, 0%, 60%)";
}

/**
 * Delays execution for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
