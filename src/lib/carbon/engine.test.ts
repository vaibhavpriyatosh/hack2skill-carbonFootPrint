import { describe, it, expect } from "vitest";
import { 
  calculateTransport, 
  calculateFood, 
  calculateEnergy, 
  calculateShopping, 
  calculateDigital, 
  calculateCarbonProfile,
  getEmissionCategory
} from "./engine";
import { AssessmentData } from "@/types/carbon";

describe("Carbon Engine Calculators", () => {
  
  // ─── Transport Calculator Tests ──────────────────────────────────────────
  describe("calculateTransport", () => {
    it("should return zero emissions for zero distance and zero flights with cycling", () => {
      const result = calculateTransport({
        commuteMode: "BICYCLE",
        commuteDistanceKm: 0,
        commuteDaysPerWeek: 0,
        shortFlightsPerYear: 0,
        longFlightsPerYear: 0
      });
      expect(result.totalKgCO2PerYear).toBe(0);
      expect(result.breakdown.commute).toBe(0);
      expect(result.breakdown.flights).toBe(0);
    });

    it("should calculate correct emissions for petrol car commute and flights", () => {
      const result = calculateTransport({
        commuteMode: "CAR_PETROL",
        commuteDistanceKm: 10,
        commuteDaysPerWeek: 5,
        shortFlightsPerYear: 2,
        longFlightsPerYear: 1
      });
      // Commute distance/week: 10 * 2 * 5 = 100 km
      // Commute distance/year: 100 * 52 = 5200 km
      // Commute emissions: 5200 * 0.21 = 1092 kg
      // Flight short: 2 * 250 = 500 kg
      // Flight long: 1 * 1500 = 1500 kg
      // Total: 1092 + 500 + 1500 = 3092 kg
      expect(result.totalKgCO2PerYear).toBe(3092);
      expect(result.breakdown.commute).toBe(1092);
      expect(result.breakdown.flights).toBe(2000);
    });
  });

  // ─── Food Calculator Tests ───────────────────────────────────────────────
  describe("calculateFood", () => {
    it("should calculate correct emissions for vegan diet with adjustments", () => {
      const result = calculateFood({
        dietType: "VEGAN",
        localFoodPercentage: 100,      // 15% discount
        foodWastePercentage: 0,        // 0% penalty
        mealsOutPerWeek: 0
      });
      // Vegan base: 1000 kg
      // Local SOURCE reduction: 1000 * 0.15 = 150 kg
      // Expected total: 1000 - 150 = 850 kg
      expect(result.totalKgCO2PerYear).toBe(850);
      expect(result.breakdown.diet).toBe(850);
      expect(result.breakdown.diningOut).toBe(0);
    });

    it("should apply food waste penalty and meals out emissions", () => {
      const result = calculateFood({
        dietType: "MEAT_HEAVY",
        localFoodPercentage: 0,
        foodWastePercentage: 50,       // 15% increase (50% of 30% max penalty)
        mealsOutPerWeek: 2             // 2 * 52 * 5 = 520 kg
      });
      // Heavy base: 3300 kg
      // Waste penalty: 3300 * 0.15 = 495 kg
      // Diet emissions: 3300 + 495 = 3795 kg
      // Total: 3795 + 520 = 4315 kg
      expect(result.totalKgCO2PerYear).toBe(4315);
      expect(result.breakdown.diet).toBe(3795);
      expect(result.breakdown.diningOut).toBe(520);
    });
  });

  // ─── Energy Calculator Tests ─────────────────────────────────────────────
  describe("calculateEnergy", () => {
    it("should calculate correct energy emissions divided by household size", () => {
      const result = calculateEnergy({
        electricityKwhPerMonth: 200,
        heatingType: "HEAT_PUMP",      // 400 kg base
        gasKwhPerMonth: 0,
        renewablePercentage: 50,       // 50% discount on electricity
        householdSize: 2
      });
      // Electricity: 200 * 12 = 2400 kWh/yr
      // Electricity emissions raw: 2400 * 0.38 = 912 kg
      // Electricity emissions with 50% renewable: 912 * 0.50 = 456 kg
      // Heat pump: 400 kg
      // Total household emissions: 456 + 400 = 856 kg
      // Per person: 856 / 2 = 428 kg
      expect(result.totalKgCO2PerYear).toBe(428);
      expect(result.breakdown.electricity).toBe(228); // 456 / 2
      expect(result.breakdown.heating).toBe(200);     // 400 / 2
      expect(result.breakdown.gas).toBe(0);
    });
  });

  // ─── Shopping Calculator Tests ───────────────────────────────────────────
  describe("calculateShopping", () => {
    it("should calculate shopping emissions with secondhand savings", () => {
      const result = calculateShopping({
        clothingItemsPerYear: 10,       // 10 * 15 = 150 kg
        electronicsPerYear: 2,         // 2 * 150 = 300 kg
        furniturePerYear: 1,           // 1 * 80 = 80 kg
        secondhandPercentage: 50       // 40% discount (50% of 80% max discount)
      });
      // Raw: 150 + 300 + 80 = 530 kg
      // Discount: 530 * 0.40 = 212 kg
      // Total: 530 - 212 = 318 kg
      expect(result.totalKgCO2PerYear).toBe(318);
      expect(result.breakdown.purchases).toBe(530);
      expect(result.breakdown.secondhandSavings).toBe(212);
    });
  });

  // ─── Digital Calculator Tests ────────────────────────────────────────────
  describe("calculateDigital", () => {
    it("should calculate screen time, streaming, and device emissions", () => {
      const result = calculateDigital({
        screenHoursPerDay: 5,          // 5 * 0.05 * 365 = 91.25 kg
        streamingHoursPerDay: 2,       // 2 * 0.08 * 365 = 58.4 kg
        cloudStorageGb: 500,           // 500 * 0.01 = 5 kg
        devicesOwned: 3                // 3 * 30 = 90 kg
      });
      const expectedTotal = 91.25 + 58.4 + 5 + 90; // 244.65 kg
      expect(result.totalKgCO2PerYear).toBeCloseTo(expectedTotal, 2);
    });
  });

  // ─── Aggregator & Category Tests ─────────────────────────────────────────
  describe("calculateCarbonProfile & Categories", () => {
    it("should categorize emission levels correctly", () => {
      expect(getEmissionCategory(2.5)).toBe("LOW");
      expect(getEmissionCategory(6.1)).toBe("MODERATE");
      expect(getEmissionCategory(10.5)).toBe("HIGH");
      expect(getEmissionCategory(14.2)).toBe("VERY_HIGH");
    });

    it("should compile profiles and convert kg to tonnes correctly", () => {
      const sampleData: AssessmentData = {
        transport: {
          commuteMode: "CAR_PETROL",
          commuteDistanceKm: 15,
          commuteDaysPerWeek: 5,
          shortFlightsPerYear: 2,
          longFlightsPerYear: 1
        },
        food: {
          dietType: "MEAT_MODERATE",
          localFoodPercentage: 30,
          foodWastePercentage: 15,
          mealsOutPerWeek: 3
        },
        energy: {
          electricityKwhPerMonth: 250,
          heatingType: "NATURAL_GAS",
          gasKwhPerMonth: 100,
          renewablePercentage: 10,
          householdSize: 2
        },
        shopping: {
          clothingItemsPerYear: 12,
          electronicsPerYear: 3,
          furniturePerYear: 1,
          secondhandPercentage: 20
        },
        digital: {
          screenHoursPerDay: 6,
          streamingHoursPerDay: 2,
          cloudStorageGb: 100,
          devicesOwned: 4
        }
      };

      const profile = calculateCarbonProfile(sampleData);
      
      expect(profile.totalEmissions).toBeGreaterThan(0);
      expect(profile.transportEmissions).toBeCloseTo(3.638, 3);
      expect(profile.category).toBeDefined();
      expect(profile.breakdown.food.totalKgCO2PerYear).toBeGreaterThan(0);
      expect(profile.breakdown.energy.totalKgCO2PerYear).toBeGreaterThan(0);
      expect(profile.breakdown.shopping.totalKgCO2PerYear).toBeGreaterThan(0);
      expect(profile.breakdown.digital.totalKgCO2PerYear).toBeGreaterThan(0);
    });
  });
});
