// ─── Carbon Types ───────────────────────────────────────────────────────

/** All supported carbon categories */
export type CarbonCategoryType =
  | "TRANSPORT"
  | "FOOD"
  | "ENERGY"
  | "SHOPPING"
  | "DIGITAL";

/** Emission classification based on annual tonnes CO2e */
export type EmissionCategoryType = "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";

// ─── Transport ──────────────────────────────────────────────────────────

export type TransportMode =
  | "CAR_PETROL"
  | "CAR_DIESEL"
  | "CAR_ELECTRIC"
  | "CAR_HYBRID"
  | "BUS"
  | "TRAIN"
  | "BICYCLE"
  | "WALKING"
  | "MOTORCYCLE";

export interface TransportInput {
  /** Primary commute mode */
  commuteMode: TransportMode;
  /** One-way commute distance in km */
  commuteDistanceKm: number;
  /** Number of commute days per week */
  commuteDaysPerWeek: number;
  /** Number of short-haul flights per year (< 3 hrs) */
  shortFlightsPerYear: number;
  /** Number of long-haul flights per year (> 3 hrs) */
  longFlightsPerYear: number;
}

// ─── Food ───────────────────────────────────────────────────────────────

export type DietType =
  | "VEGAN"
  | "VEGETARIAN"
  | "PESCATARIAN"
  | "FLEXITARIAN"
  | "MEAT_MODERATE"
  | "MEAT_HEAVY";

export interface FoodInput {
  /** Primary diet type */
  dietType: DietType;
  /** Percentage of food that is locally sourced (0-100) */
  localFoodPercentage: number;
  /** Percentage of food wasted (0-100) */
  foodWastePercentage: number;
  /** Number of meals eaten out per week */
  mealsOutPerWeek: number;
}

// ─── Energy ─────────────────────────────────────────────────────────────

export type HeatingType = "NATURAL_GAS" | "ELECTRIC" | "OIL" | "HEAT_PUMP" | "WOOD";

export interface EnergyInput {
  /** Monthly electricity usage in kWh */
  electricityKwhPerMonth: number;
  /** Primary heating type */
  heatingType: HeatingType;
  /** Monthly gas usage in kWh (0 if not applicable) */
  gasKwhPerMonth: number;
  /** Percentage of energy from renewables (0-100) */
  renewablePercentage: number;
  /** Number of people in household */
  householdSize: number;
}

// ─── Shopping ───────────────────────────────────────────────────────────

export interface ShoppingInput {
  /** Clothing items purchased per year */
  clothingItemsPerYear: number;
  /** Electronics purchased per year */
  electronicsPerYear: number;
  /** Furniture items purchased per year */
  furniturePerYear: number;
  /** Percentage of items bought secondhand (0-100) */
  secondhandPercentage: number;
}

// ─── Digital ────────────────────────────────────────────────────────────

export interface DigitalInput {
  /** Average daily screen time in hours */
  screenHoursPerDay: number;
  /** Daily streaming hours (video) */
  streamingHoursPerDay: number;
  /** Cloud storage used in GB */
  cloudStorageGb: number;
  /** Number of devices owned */
  devicesOwned: number;
}

// ─── Results ────────────────────────────────────────────────────────────

export interface CategoryResult {
  /** Total kg CO2e per year for this category */
  totalKgCO2PerYear: number;
  /** Breakdown by sub-item */
  breakdown: Record<string, number>;
}

export interface CarbonProfileResult {
  totalEmissions: number;
  transportEmissions: number;
  foodEmissions: number;
  energyEmissions: number;
  shoppingEmissions: number;
  digitalEmissions: number;
  category: EmissionCategoryType;
  breakdown: {
    transport: CategoryResult;
    food: CategoryResult;
    energy: CategoryResult;
    shopping: CategoryResult;
    digital: CategoryResult;
  };
}

// ─── Assessment ─────────────────────────────────────────────────────────

export interface AssessmentData {
  transport: TransportInput;
  food: FoodInput;
  energy: EnergyInput;
  shopping: ShoppingInput;
  digital: DigitalInput;
}
