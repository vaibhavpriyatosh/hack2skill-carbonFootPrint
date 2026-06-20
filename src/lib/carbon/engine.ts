import { 
  TransportInput, 
  FoodInput, 
  EnergyInput, 
  ShoppingInput, 
  DigitalInput, 
  CategoryResult, 
  CarbonProfileResult, 
  AssessmentData,
  EmissionCategoryType
} from "@/types/carbon";

// ─── Transport Factors & Calculator ────────────────────────────────────────

export const TRANSPORT_FACTORS = {
  CAR_PETROL: 0.21,     // kg CO2e per km
  CAR_DIESEL: 0.17,     // kg CO2e per km
  CAR_ELECTRIC: 0.05,   // kg CO2e per km
  CAR_HYBRID: 0.10,     // kg CO2e per km
  BUS: 0.089,           // kg CO2e per km
  TRAIN: 0.041,         // kg CO2e per km
  MOTORCYCLE: 0.113,    // kg CO2e per km
  BICYCLE: 0.0,
  WALKING: 0.0,
  FLIGHT_SHORT: 250,    // kg CO2e per short-haul flight
  FLIGHT_LONG: 1500,    // kg CO2e per long-haul flight
} as const;

/**
 * Calculates carbon emissions related to transportation.
 * Factor inputs include commute mode, distance, days of travel per week, and flight counts.
 * 
 * @param input Commute and flight patterns.
 * @returns Object containing total annual emissions in kg CO2e and its breakdown.
 */
export function calculateTransport(input: TransportInput): CategoryResult {
  const weeklyCommuteDistance = input.commuteDistanceKm * 2 * input.commuteDaysPerWeek; // round trip
  const annualCommuteDistance = weeklyCommuteDistance * 52;
  const commuteEmissions = annualCommuteDistance * (TRANSPORT_FACTORS[input.commuteMode] ?? 0);
  
  const shortFlightEmissions = input.shortFlightsPerYear * TRANSPORT_FACTORS.FLIGHT_SHORT;
  const longFlightEmissions = input.longFlightsPerYear * TRANSPORT_FACTORS.FLIGHT_LONG;
  
  const totalKgCO2PerYear = commuteEmissions + shortFlightEmissions + longFlightEmissions;
  
  return {
    totalKgCO2PerYear,
    breakdown: {
      commute: commuteEmissions,
      flights: shortFlightEmissions + longFlightEmissions,
    }
  };
}

// ─── Food Factors & Calculator ─────────────────────────────────────────────

export const DIET_BASE_EMISSIONS = {
  VEGAN: 1000,          // kg CO2e per year base
  VEGETARIAN: 1400,
  PESCATARIAN: 1600,
  FLEXITARIAN: 2000,
  MEAT_MODERATE: 2500,
  MEAT_HEAVY: 3300,
} as const;

/**
 * Calculates carbon emissions related to diet and food waste.
 * Factors in base diet emissions, offset by local food choices and penalized by waste level.
 * 
 * @param input Diet choices, local source share, waste share, and dining frequency.
 * @returns Object containing total annual emissions in kg CO2e and its breakdown.
 */
export function calculateFood(input: FoodInput): CategoryResult {
  const baseEmissions = DIET_BASE_EMISSIONS[input.dietType] ?? 2000;
  
  // Local sourcing reduction: up to 15% reduction for 100% local food
  const localReduction = baseEmissions * (input.localFoodPercentage / 100) * 0.15;
  
  // Food waste penalty: up to 30% increase for 100% food waste
  const wastePenalty = baseEmissions * (input.foodWastePercentage / 100) * 0.30;
  
  // Meals out emissions (approx 5 kg CO2e per meal dining out)
  const mealsOutEmissions = input.mealsOutPerWeek * 52 * 5;
  
  const dietEmissions = baseEmissions - localReduction + wastePenalty;
  const totalKgCO2PerYear = dietEmissions + mealsOutEmissions;
  
  return {
    totalKgCO2PerYear,
    breakdown: {
      diet: dietEmissions,
      diningOut: mealsOutEmissions,
    }
  };
}

// ─── Energy Factors & Calculator ────────────────────────────────────────────

export const HEATING_BASE = {
  NATURAL_GAS: 2000,    // kg CO2e per year base for household
  ELECTRIC: 1500,
  OIL: 3500,
  HEAT_PUMP: 400,
  WOOD: 800,
} as const;

/**
 * Calculates carbon emissions related to household energy and fuel consumption.
 * Combines electricity, gas, and primary heating fuel, divided by household size.
 * 
 * @param input Utility usage, heating type, renewable share, and household size.
 * @returns Object containing total annual emissions in kg CO2e and its breakdown.
 */
export function calculateEnergy(input: EnergyInput): CategoryResult {
  const annualElectricity = input.electricityKwhPerMonth * 12;
  // Grid electricity factor 0.38 kg/kWh, offset by renewables
  const electricityEmissions = annualElectricity * 0.38 * (1 - input.renewablePercentage / 100);
  
  const annualGas = input.gasKwhPerMonth * 12;
  const gasEmissions = annualGas * 0.18; // Gas factor 0.18 kg/kWh
  
  const heatingEmissions = HEATING_BASE[input.heatingType] ?? 1500;
  
  // Emissions are calculated for the household first, then shared by the household size
  const totalHouseEmissions = electricityEmissions + gasEmissions + heatingEmissions;
  const totalKgCO2PerYear = totalHouseEmissions / Math.max(1, input.householdSize);
  
  return {
    totalKgCO2PerYear,
    breakdown: {
      electricity: electricityEmissions / Math.max(1, input.householdSize),
      gas: gasEmissions / Math.max(1, input.householdSize),
      heating: heatingEmissions / Math.max(1, input.householdSize),
    }
  };
}

// ─── Shopping Factors & Calculator ──────────────────────────────────────────

export const SHOPPING_FACTORS = {
  CLOTHING: 15,         // kg CO2e per item
  ELECTRONICS: 150,     // kg CO2e per item
  FURNITURE: 80,        // kg CO2e per item
} as const;

/**
 * Calculates carbon emissions associated with purchasing new goods/furniture/clothing.
 * Applies a significant discount if a percentage of the items are bought secondhand.
 * 
 * @param input Item counts per category and secondhand purchase percentage.
 * @returns Object containing total annual emissions in kg CO2e and its breakdown.
 */
export function calculateShopping(input: ShoppingInput): CategoryResult {
  const rawEmissions = (input.clothingItemsPerYear * SHOPPING_FACTORS.CLOTHING) +
                       (input.electronicsPerYear * SHOPPING_FACTORS.ELECTRONICS) +
                       (input.furniturePerYear * SHOPPING_FACTORS.FURNITURE);
  
  // Secondhand discount: reduces footprint of purchased items by up to 80% if 100% secondhand
  const secondhandDiscount = rawEmissions * (input.secondhandPercentage / 100) * 0.80;
  const totalKgCO2PerYear = rawEmissions - secondhandDiscount;
  
  return {
    totalKgCO2PerYear,
    breakdown: {
      purchases: rawEmissions,
      secondhandSavings: secondhandDiscount,
    }
  };
}

// ─── Digital Factors & Calculator ───────────────────────────────────────────

export const DIGITAL_FACTORS = {
  SCREEN_HOUR_DAILY: 0.05 * 365,      // annual kg CO2e per daily hour of screen time
  STREAMING_HOUR_DAILY: 0.08 * 365,   // annual kg CO2e per daily hour of video streaming
  CLOUD_STORAGE_GB_ANNUAL: 0.01,      // annual kg CO2e per GB of cloud storage
  DEVICE_ANNUAL: 30,                  // annual kg CO2e per device owned (amortized)
} as const;

/**
 * Calculates carbon emissions from digital usage, including screen time,
 * video streaming data center cost, cloud storage scale, and hardware devices.
 * 
 * @param input Daily screen/streaming hours, cloud storage size, and hardware device counts.
 * @returns Object containing total annual emissions in kg CO2e and its breakdown.
 */
export function calculateDigital(input: DigitalInput): CategoryResult {
  const screenEmissions = input.screenHoursPerDay * DIGITAL_FACTORS.SCREEN_HOUR_DAILY;
  const streamingEmissions = input.streamingHoursPerDay * DIGITAL_FACTORS.STREAMING_HOUR_DAILY;
  const cloudEmissions = input.cloudStorageGb * DIGITAL_FACTORS.CLOUD_STORAGE_GB_ANNUAL;
  const deviceEmissions = input.devicesOwned * DIGITAL_FACTORS.DEVICE_ANNUAL;
  
  const totalKgCO2PerYear = screenEmissions + streamingEmissions + cloudEmissions + deviceEmissions;
  
  return {
    totalKgCO2PerYear,
    breakdown: {
      screenTime: screenEmissions,
      streaming: streamingEmissions,
      cloud: cloudEmissions,
      devices: deviceEmissions,
    }
  };
}

// ─── Aggregator & Profile Generator ─────────────────────────────────────────

/**
 * Categorizes a carbon footprint based on its yearly emissions in tonnes of CO2e.
 * 
 * @param totalTonnes Total emissions in metric tonnes.
 * @returns An emission category string ("LOW", "MODERATE", "HIGH", or "VERY_HIGH").
 */
export function getEmissionCategory(totalTonnes: number): EmissionCategoryType {
  if (totalTonnes < 4) return "LOW";
  if (totalTonnes < 8) return "MODERATE";
  if (totalTonnes < 12) return "HIGH";
  return "VERY_HIGH";
}

/**
 * Aggregates all carbon assessment categories into a single carbon profile.
 * Computes individual category tonnes, total footprint, and overall classification rating.
 * 
 * @param data Completed assessment questionnaire details.
 * @returns Standard carbon footprint results dashboard schema.
 */
export function calculateCarbonProfile(data: AssessmentData): CarbonProfileResult {
  const transport = calculateTransport(data.transport);
  const food = calculateFood(data.food);
  const energy = calculateEnergy(data.energy);
  const shopping = calculateShopping(data.shopping);
  const digital = calculateDigital(data.digital);
  
  const totalKg = transport.totalKgCO2PerYear +
                  food.totalKgCO2PerYear +
                  energy.totalKgCO2PerYear +
                  shopping.totalKgCO2PerYear +
                  digital.totalKgCO2PerYear;
                  
  const totalTonnes = totalKg / 1000;
  
  return {
    totalEmissions: totalTonnes,
    transportEmissions: transport.totalKgCO2PerYear / 1000,
    foodEmissions: food.totalKgCO2PerYear / 1000,
    energyEmissions: energy.totalKgCO2PerYear / 1000,
    shoppingEmissions: shopping.totalKgCO2PerYear / 1000,
    digitalEmissions: digital.totalKgCO2PerYear / 1000,
    category: getEmissionCategory(totalTonnes),
    breakdown: {
      transport,
      food,
      energy,
      shopping,
      digital
    }
  };
}
