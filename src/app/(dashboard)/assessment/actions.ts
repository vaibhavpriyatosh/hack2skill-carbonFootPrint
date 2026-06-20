"use server";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma/client";
import { calculateCarbonProfile } from "@/lib/carbon/engine";
import { generateAndSaveRecommendations } from "@/lib/gemini/recommendations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const assessmentSchema = z.object({
  transport: z.object({
    commuteMode: z.enum([
      "CAR_PETROL",
      "CAR_DIESEL",
      "CAR_ELECTRIC",
      "CAR_HYBRID",
      "BUS",
      "TRAIN",
      "BICYCLE",
      "WALKING",
      "MOTORCYCLE",
    ]),
    commuteDistanceKm: z.number().min(0).max(1000),
    commuteDaysPerWeek: z.number().min(0).max(7),
    shortFlightsPerYear: z.number().min(0).max(100),
    longFlightsPerYear: z.number().min(0).max(100),
  }),
  food: z.object({
    dietType: z.enum([
      "VEGAN",
      "VEGETARIAN",
      "PESCATARIAN",
      "FLEXITARIAN",
      "MEAT_MODERATE",
      "MEAT_HEAVY",
    ]),
    localFoodPercentage: z.number().min(0).max(100),
    foodWastePercentage: z.number().min(0).max(100),
    mealsOutPerWeek: z.number().min(0).max(21),
  }),
  energy: z.object({
    electricityKwhPerMonth: z.number().min(0),
    heatingType: z.enum(["NATURAL_GAS", "ELECTRIC", "OIL", "HEAT_PUMP", "WOOD"]),
    gasKwhPerMonth: z.number().min(0),
    renewablePercentage: z.number().min(0).max(100),
    householdSize: z.number().min(1),
  }),
  shopping: z.object({
    clothingItemsPerYear: z.number().min(0),
    electronicsPerYear: z.number().min(0),
    furniturePerYear: z.number().min(0),
    secondhandPercentage: z.number().min(0).max(100),
  }),
  digital: z.object({
    screenHoursPerDay: z.number().min(0).max(24),
    streamingHoursPerDay: z.number().min(0).max(24),
    cloudStorageGb: z.number().min(0),
    devicesOwned: z.number().min(0),
  }),
});

/**
 * Handles the submission of a user's multi-step carbon footprint assessment.
 * Parses and validates input data using Zod, calculates the user's carbon profile details,
 * saves both the raw assessment and calculated profile to the database in a transaction,
 * triggers an asynchronous AI recommendations call, and redirects the user to their dashboard.
 *
 * @param data The raw assessment form data submitted from the UI.
 * @returns An error response object if validation or execution fails.
 */
export async function submitAssessment(data: unknown): Promise<{ error?: string } | never> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: "You must be logged in to submit an assessment." };
  }

  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  if (!userExists) {
    // Stale cookie: clear the session so middleware doesn't redirect back to /dashboard
    await signOut({ redirectTo: "/login" });
    return { error: "Session invalid. Please log in again." };
  }
  
  const validatedFields = assessmentSchema.safeParse(data);
  if (!validatedFields.success) {
    return { error: "Invalid input data: " + validatedFields.error.issues[0].message };
  }
  
  const assessmentData = validatedFields.data;
  
  try {
    const profile = calculateCarbonProfile(assessmentData);
    
    let savedProfileId = "";

    await prisma.$transaction(async (tx) => {
      const assessment = await tx.assessment.create({
        data: {
          userId,
          transportData: assessmentData.transport as Prisma.InputJsonValue,
          foodData: assessmentData.food as Prisma.InputJsonValue,
          energyData: assessmentData.energy as Prisma.InputJsonValue,
          shoppingData: assessmentData.shopping as Prisma.InputJsonValue,
          digitalData: assessmentData.digital as Prisma.InputJsonValue,
          status: "COMPLETED",
          completedAt: new Date(),
        }
      });
      
      const carbonProfile = await tx.carbonProfile.create({
        data: {
          userId,
          assessmentId: assessment.id,
          totalEmissions: profile.totalEmissions,
          transportEmissions: profile.transportEmissions,
          foodEmissions: profile.foodEmissions,
          energyEmissions: profile.energyEmissions,
          shoppingEmissions: profile.shoppingEmissions,
          digitalEmissions: profile.digitalEmissions,
          category: profile.category,
        }
      });

      savedProfileId = carbonProfile.id;
    });

    // Fire-and-forget: generate AI recommendations after saving (non-blocking)
    generateAndSaveRecommendations({
      userId,
      profileId: savedProfileId,
      totalEmissions: profile.totalEmissions,
      transportEmissions: profile.transportEmissions,
      foodEmissions: profile.foodEmissions,
      energyEmissions: profile.energyEmissions,
      shoppingEmissions: profile.shoppingEmissions,
      digitalEmissions: profile.digitalEmissions,
      category: profile.category,
    }).catch((err) => {
      console.error("Failed to generate AI recommendations in background:", err);
    });
    
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Failed to save assessment:", errorMsg);
    return { error: "Failed to save assessment to database." };
  }
  
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

