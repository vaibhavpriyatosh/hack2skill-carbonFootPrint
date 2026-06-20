"use server";

import { prisma } from "@/lib/prisma/client";

interface CarbonProfileInput {
  userId: string;
  profileId: string;
  totalEmissions: number;
  transportEmissions: number;
  foodEmissions: number;
  energyEmissions: number;
  shoppingEmissions: number;
  digitalEmissions: number;
  category: string;
}

const DIFFICULTY_MAP: Record<string, "EASY" | "MODERATE" | "HARD"> = {
  easy: "EASY",
  moderate: "MODERATE",
  hard: "HARD",
};

const CATEGORY_MAP: Record<string, "TRANSPORT" | "FOOD" | "ENERGY" | "SHOPPING" | "DIGITAL"> = {
  TRANSPORT: "TRANSPORT",
  FOOD: "FOOD",
  ENERGY: "ENERGY",
  SHOPPING: "SHOPPING",
  DIGITAL: "DIGITAL",
};

/**
 * Asynchronously generates personalized carbon reduction recommendations using OpenRouter AI.
 * Prompt is tailored dynamically based on user's highest emitting categories.
 * Validates result schema before batch inserting up to 5 recommendations into Prisma.
 *
 * @param profile Calculated carbon profile metrics used to customize recommendations.
 */
export async function generateAndSaveRecommendations(profile: CarbonProfileInput): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY not set — skipping AI recommendations");
    return;
  }

  const prompt = `You are a carbon footprint expert. A user has completed a carbon assessment with these results:

Total annual emissions: ${profile.totalEmissions.toFixed(2)} tonnes CO₂e
Category: ${profile.category}
Breakdown:
- Transport: ${profile.transportEmissions.toFixed(2)} tonnes CO₂e/year
- Food & Diet: ${profile.foodEmissions.toFixed(2)} tonnes CO₂e/year
- Household Energy: ${profile.energyEmissions.toFixed(2)} tonnes CO₂e/year
- Shopping & Consumption: ${profile.shoppingEmissions.toFixed(2)} tonnes CO₂e/year
- Digital Footprint: ${profile.digitalEmissions.toFixed(2)} tonnes CO₂e/year

Generate exactly 5 personalised, actionable recommendations to reduce this person's carbon footprint.
Focus on their highest-emission categories first.

Respond ONLY with a valid JSON array (no markdown, no code fences) in this exact format:
[
  {
    "category": "TRANSPORT",
    "title": "Short title (max 8 words)",
    "description": "Detailed, specific advice (2-3 sentences) with concrete numbers or percentages where possible.",
    "potentialReduction": 0.5,
    "difficulty": "easy"
  }
]

Rules:
- category must be one of: TRANSPORT, FOOD, ENERGY, SHOPPING, DIGITAL
- difficulty must be one of: easy, moderate, hard
- potentialReduction is in tonnes CO₂e per year (realistic estimate)
- Make descriptions specific and motivating, not generic
- Order by highest impact first`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "CarbonCoach AI",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text: string = json.choices?.[0]?.message?.content ?? "";

    // Strip markdown fences if model wraps in ```json ... ```
    const clean = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

    if (!clean) {
      throw new Error("Received empty content from AI completion");
    }

    const recommendations = JSON.parse(clean);
    if (!Array.isArray(recommendations)) {
      throw new Error("AI response content is not a valid JSON array");
    }

    // Limit to exactly 5 recommendations max and format securely
    const verifiedRecommendations = recommendations.slice(0, 5).map((r: any) => {
      const cat = String(r.category || "TRANSPORT").toUpperCase();
      const diff = String(r.difficulty || "moderate").toLowerCase();
      return {
        userId: profile.userId,
        profileId: profile.profileId,
        category: CATEGORY_MAP[cat] ?? "TRANSPORT",
        title: String(r.title || "Reduce Emissions").substring(0, 100),
        description: String(r.description || "Take active steps to lower your impact."),
        potentialReduction: Math.max(0.01, Number(r.potentialReduction) || 0.1),
        difficulty: DIFFICULTY_MAP[diff] ?? "MODERATE",
        status: "PENDING" as const,
      };
    });

    if (verifiedRecommendations.length === 0) {
      throw new Error("No valid recommendations extracted from AI output");
    }

    await prisma.recommendation.createMany({
      data: verifiedRecommendations,
    });

    console.log(`✅ Generated ${verifiedRecommendations.length} AI recommendations via OpenRouter`);
  } catch (err: unknown) {
    // Non-fatal — log and continue, dashboard shows "Generating..." state
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("Failed to generate AI recommendations:", errMsg);
  }
}
