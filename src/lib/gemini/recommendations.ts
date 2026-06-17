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

export async function generateAndSaveRecommendations(profile: CarbonProfileInput) {
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
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${err}`);
    }

    const json = await response.json();
    const text: string = json.choices?.[0]?.message?.content ?? "";

    // Strip markdown fences if model wraps in ```json ... ```
    const clean = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

    const recommendations = JSON.parse(clean) as Array<{
      category: string;
      title: string;
      description: string;
      potentialReduction: number;
      difficulty: string;
    }>;

    await prisma.recommendation.createMany({
      data: recommendations.map((r) => ({
        userId: profile.userId,
        profileId: profile.profileId,
        category: CATEGORY_MAP[r.category] ?? "TRANSPORT",
        title: r.title,
        description: r.description,
        potentialReduction: Number(r.potentialReduction) || 0.1,
        difficulty: DIFFICULTY_MAP[r.difficulty?.toLowerCase()] ?? "MODERATE",
        status: "PENDING",
      })),
    });

    console.log(`✅ Generated ${recommendations.length} AI recommendations via OpenRouter`);
  } catch (err) {
    // Non-fatal — log and continue, dashboard shows "Generating..." state
    console.error("Failed to generate AI recommendations:", err);
  }
}
