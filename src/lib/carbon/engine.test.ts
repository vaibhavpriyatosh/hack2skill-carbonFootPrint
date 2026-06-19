import { describe, it, expect } from "vitest";
import {
  calculateTransport,
  calculateFood,
  calculateEnergy,
  calculateShopping,
  calculateDigital,
  calculateCarbonProfile,
  getEmissionCategory,
  TRANSPORT_FACTORS,
  DIET_BASE_EMISSIONS,
  HEATING_BASE,
  SHOPPING_FACTORS,
  DIGITAL_FACTORS,
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
        longFlightsPerYear: 0,
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
        longFlightsPerYear: 1,
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

    it.each([
      ["CAR_DIESEL", TRANSPORT_FACTORS.CAR_DIESEL],
      ["CAR_ELECTRIC", TRANSPORT_FACTORS.CAR_ELECTRIC],
      ["CAR_HYBRID", TRANSPORT_FACTORS.CAR_HYBRID],
      ["BUS", TRANSPORT_FACTORS.BUS],
      ["TRAIN", TRANSPORT_FACTORS.TRAIN],
      ["MOTORCYCLE", TRANSPORT_FACTORS.MOTORCYCLE],
      ["WALKING", TRANSPORT_FACTORS.WALKING],
    ] as const)("should calculate %s commute emissions with correct factor", (mode, factor) => {
      const result = calculateTransport({
        commuteMode: mode,
        commuteDistanceKm: 20,
        commuteDaysPerWeek: 5,
        shortFlightsPerYear: 0,
        longFlightsPerYear: 0,
      });
      // Round trip: 20 * 2 = 40 km/day, 40 * 5 = 200 km/week, 200 * 52 = 10400 km/year
      const expected = 10400 * factor;
      expect(result.totalKgCO2PerYear).toBeCloseTo(expected, 2);
      expect(result.breakdown.flights).toBe(0);
    });

    it("should isolate flight emissions from commute", () => {
      const result = calculateTransport({
        commuteMode: "WALKING",
        commuteDistanceKm: 5,
        commuteDaysPerWeek: 7,
        shortFlightsPerYear: 10,
        longFlightsPerYear: 5,
      });
      expect(result.breakdown.commute).toBe(0);
      expect(result.breakdown.flights).toBe(10 * 250 + 5 * 1500);
    });

    it("should handle zero commute days per week", () => {
      const result = calculateTransport({
        commuteMode: "CAR_PETROL",
        commuteDistanceKm: 50,
        commuteDaysPerWeek: 0,
        shortFlightsPerYear: 0,
        longFlightsPerYear: 0,
      });
      expect(result.breakdown.commute).toBe(0);
      expect(result.totalKgCO2PerYear).toBe(0);
    });

    it("should handle only short flights", () => {
      const result = calculateTransport({
        commuteMode: "BICYCLE",
        commuteDistanceKm: 0,
        commuteDaysPerWeek: 0,
        shortFlightsPerYear: 4,
        longFlightsPerYear: 0,
      });
      expect(result.totalKgCO2PerYear).toBe(4 * 250);
    });

    it("should handle only long flights", () => {
      const result = calculateTransport({
        commuteMode: "BICYCLE",
        commuteDistanceKm: 0,
        commuteDaysPerWeek: 0,
        shortFlightsPerYear: 0,
        longFlightsPerYear: 3,
      });
      expect(result.totalKgCO2PerYear).toBe(3 * 1500);
    });
  });

  // ─── Food Calculator Tests ───────────────────────────────────────────────
  describe("calculateFood", () => {
    it("should calculate correct emissions for vegan diet with 100% local sourcing", () => {
      const result = calculateFood({
        dietType: "VEGAN",
        localFoodPercentage: 100,
        foodWastePercentage: 0,
        mealsOutPerWeek: 0,
      });
      // Vegan base: 1000 kg, 15% local reduction = 150 => 850
      expect(result.totalKgCO2PerYear).toBe(850);
      expect(result.breakdown.diet).toBe(850);
      expect(result.breakdown.diningOut).toBe(0);
    });

    it("should apply food waste penalty and meals out emissions", () => {
      const result = calculateFood({
        dietType: "MEAT_HEAVY",
        localFoodPercentage: 0,
        foodWastePercentage: 50,
        mealsOutPerWeek: 2,
      });
      // Heavy base: 3300 kg, waste: 3300 * 0.15 = 495 => 3795, dining: 2 * 52 * 5 = 520
      expect(result.totalKgCO2PerYear).toBe(4315);
      expect(result.breakdown.diet).toBe(3795);
      expect(result.breakdown.diningOut).toBe(520);
    });

    it.each([
      ["VEGAN", DIET_BASE_EMISSIONS.VEGAN],
      ["VEGETARIAN", DIET_BASE_EMISSIONS.VEGETARIAN],
      ["PESCATARIAN", DIET_BASE_EMISSIONS.PESCATARIAN],
      ["FLEXITARIAN", DIET_BASE_EMISSIONS.FLEXITARIAN],
      ["MEAT_MODERATE", DIET_BASE_EMISSIONS.MEAT_MODERATE],
      ["MEAT_HEAVY", DIET_BASE_EMISSIONS.MEAT_HEAVY],
    ] as const)("should use correct base emissions for %s diet", (diet, base) => {
      const result = calculateFood({
        dietType: diet,
        localFoodPercentage: 0,
        foodWastePercentage: 0,
        mealsOutPerWeek: 0,
      });
      expect(result.totalKgCO2PerYear).toBe(base);
    });

    it("should handle 100% food waste penalty", () => {
      const result = calculateFood({
        dietType: "VEGETARIAN",
        localFoodPercentage: 0,
        foodWastePercentage: 100,
        mealsOutPerWeek: 0,
      });
      // 1400 + 1400 * 0.30 = 1400 + 420 = 1820
      expect(result.totalKgCO2PerYear).toBe(1820);
    });

    it("should combine local reduction and waste penalty correctly", () => {
      const result = calculateFood({
        dietType: "MEAT_MODERATE",
        localFoodPercentage: 50,
        foodWastePercentage: 50,
        mealsOutPerWeek: 0,
      });
      // Base: 2500
      // Local reduction: 2500 * 0.5 * 0.15 = 187.5
      // Waste penalty: 2500 * 0.5 * 0.30 = 375
      // Diet: 2500 - 187.5 + 375 = 2687.5
      expect(result.totalKgCO2PerYear).toBe(2687.5);
    });

    it("should handle zero meals out", () => {
      const result = calculateFood({
        dietType: "VEGAN",
        localFoodPercentage: 0,
        foodWastePercentage: 0,
        mealsOutPerWeek: 0,
      });
      expect(result.breakdown.diningOut).toBe(0);
    });

    it("should calculate high dining-out scenario", () => {
      const result = calculateFood({
        dietType: "VEGAN",
        localFoodPercentage: 0,
        foodWastePercentage: 0,
        mealsOutPerWeek: 14,
      });
      expect(result.breakdown.diningOut).toBe(14 * 52 * 5);
    });
  });

  // ─── Energy Calculator Tests ─────────────────────────────────────────────
  describe("calculateEnergy", () => {
    it("should calculate correct energy emissions divided by household size", () => {
      const result = calculateEnergy({
        electricityKwhPerMonth: 200,
        heatingType: "HEAT_PUMP",
        gasKwhPerMonth: 0,
        renewablePercentage: 50,
        householdSize: 2,
      });
      // Electricity: 200 * 12 * 0.38 * 0.5 = 456 kg -> /2 = 228
      // Heating: 400 / 2 = 200
      expect(result.totalKgCO2PerYear).toBe(428);
      expect(result.breakdown.electricity).toBe(228);
      expect(result.breakdown.heating).toBe(200);
      expect(result.breakdown.gas).toBe(0);
    });

    it.each([
      ["NATURAL_GAS", HEATING_BASE.NATURAL_GAS],
      ["ELECTRIC", HEATING_BASE.ELECTRIC],
      ["OIL", HEATING_BASE.OIL],
      ["HEAT_PUMP", HEATING_BASE.HEAT_PUMP],
      ["WOOD", HEATING_BASE.WOOD],
    ] as const)("should use correct heating base for %s", (type, base) => {
      const result = calculateEnergy({
        electricityKwhPerMonth: 0,
        heatingType: type,
        gasKwhPerMonth: 0,
        renewablePercentage: 0,
        householdSize: 1,
      });
      expect(result.breakdown.heating).toBe(base);
    });

    it("should reduce electricity emissions fully with 100% renewables", () => {
      const result = calculateEnergy({
        electricityKwhPerMonth: 500,
        heatingType: "HEAT_PUMP",
        gasKwhPerMonth: 0,
        renewablePercentage: 100,
        householdSize: 1,
      });
      expect(result.breakdown.electricity).toBe(0);
    });

    it("should calculate gas emissions correctly", () => {
      const result = calculateEnergy({
        electricityKwhPerMonth: 0,
        heatingType: "HEAT_PUMP",
        gasKwhPerMonth: 100,
        renewablePercentage: 0,
        householdSize: 1,
      });
      // 100 * 12 * 0.18 = 216
      expect(result.breakdown.gas).toBe(216);
    });

    it("should divide all categories by household size", () => {
      const result = calculateEnergy({
        electricityKwhPerMonth: 300,
        heatingType: "NATURAL_GAS",
        gasKwhPerMonth: 200,
        renewablePercentage: 0,
        householdSize: 4,
      });
      const elecFull = 300 * 12 * 0.38;
      const gasFull = 200 * 12 * 0.18;
      const heatFull = HEATING_BASE.NATURAL_GAS;
      expect(result.breakdown.electricity).toBeCloseTo(elecFull / 4, 2);
      expect(result.breakdown.gas).toBeCloseTo(gasFull / 4, 2);
      expect(result.breakdown.heating).toBeCloseTo(heatFull / 4, 2);
    });

    it("should handle household size of 1 (no division)", () => {
      const result = calculateEnergy({
        electricityKwhPerMonth: 100,
        heatingType: "WOOD",
        gasKwhPerMonth: 0,
        renewablePercentage: 0,
        householdSize: 1,
      });
      expect(result.breakdown.electricity).toBe(100 * 12 * 0.38);
      expect(result.breakdown.heating).toBe(HEATING_BASE.WOOD);
    });

    it("should protect against household size of 0", () => {
      const result = calculateEnergy({
        electricityKwhPerMonth: 100,
        heatingType: "ELECTRIC",
        gasKwhPerMonth: 0,
        renewablePercentage: 0,
        householdSize: 0,
      });
      // Math.max(1, 0) = 1, should not divide by zero
      expect(result.totalKgCO2PerYear).toBeGreaterThan(0);
      expect(Number.isFinite(result.totalKgCO2PerYear)).toBe(true);
    });
  });

  // ─── Shopping Calculator Tests ───────────────────────────────────────────
  describe("calculateShopping", () => {
    it("should calculate shopping emissions with secondhand savings", () => {
      const result = calculateShopping({
        clothingItemsPerYear: 10,
        electronicsPerYear: 2,
        furniturePerYear: 1,
        secondhandPercentage: 50,
      });
      // Raw: 150 + 300 + 80 = 530
      // Discount: 530 * 0.40 = 212
      expect(result.totalKgCO2PerYear).toBe(318);
      expect(result.breakdown.purchases).toBe(530);
      expect(result.breakdown.secondhandSavings).toBe(212);
    });

    it("should return zero for zero purchases", () => {
      const result = calculateShopping({
        clothingItemsPerYear: 0,
        electronicsPerYear: 0,
        furniturePerYear: 0,
        secondhandPercentage: 100,
      });
      expect(result.totalKgCO2PerYear).toBe(0);
      expect(result.breakdown.purchases).toBe(0);
      expect(result.breakdown.secondhandSavings).toBe(0);
    });

    it("should not reduce emissions when secondhand is 0%", () => {
      const result = calculateShopping({
        clothingItemsPerYear: 5,
        electronicsPerYear: 1,
        furniturePerYear: 0,
        secondhandPercentage: 0,
      });
      const raw = 5 * SHOPPING_FACTORS.CLOTHING + 1 * SHOPPING_FACTORS.ELECTRONICS;
      expect(result.totalKgCO2PerYear).toBe(raw);
      expect(result.breakdown.secondhandSavings).toBe(0);
    });

    it("should apply max 80% discount for 100% secondhand", () => {
      const result = calculateShopping({
        clothingItemsPerYear: 10,
        electronicsPerYear: 0,
        furniturePerYear: 0,
        secondhandPercentage: 100,
      });
      const raw = 10 * SHOPPING_FACTORS.CLOTHING; // 150
      const discount = raw * 0.80; // 120
      expect(result.totalKgCO2PerYear).toBe(raw - discount);
    });

    it("should calculate only clothing emissions correctly", () => {
      const result = calculateShopping({
        clothingItemsPerYear: 20,
        electronicsPerYear: 0,
        furniturePerYear: 0,
        secondhandPercentage: 0,
      });
      expect(result.breakdown.purchases).toBe(20 * SHOPPING_FACTORS.CLOTHING);
    });

    it("should calculate only electronics emissions correctly", () => {
      const result = calculateShopping({
        clothingItemsPerYear: 0,
        electronicsPerYear: 5,
        furniturePerYear: 0,
        secondhandPercentage: 0,
      });
      expect(result.breakdown.purchases).toBe(5 * SHOPPING_FACTORS.ELECTRONICS);
    });

    it("should calculate only furniture emissions correctly", () => {
      const result = calculateShopping({
        clothingItemsPerYear: 0,
        electronicsPerYear: 0,
        furniturePerYear: 3,
        secondhandPercentage: 0,
      });
      expect(result.breakdown.purchases).toBe(3 * SHOPPING_FACTORS.FURNITURE);
    });
  });

  // ─── Digital Calculator Tests ────────────────────────────────────────────
  describe("calculateDigital", () => {
    it("should calculate all digital sub-categories", () => {
      const result = calculateDigital({
        screenHoursPerDay: 5,
        streamingHoursPerDay: 2,
        cloudStorageGb: 500,
        devicesOwned: 3,
      });
      const expected = 91.25 + 58.4 + 5 + 90;
      expect(result.totalKgCO2PerYear).toBeCloseTo(expected, 2);
    });

    it("should return zero for zero usage", () => {
      const result = calculateDigital({
        screenHoursPerDay: 0,
        streamingHoursPerDay: 0,
        cloudStorageGb: 0,
        devicesOwned: 0,
      });
      expect(result.totalKgCO2PerYear).toBe(0);
    });

    it("should calculate screen time isolation", () => {
      const result = calculateDigital({
        screenHoursPerDay: 8,
        streamingHoursPerDay: 0,
        cloudStorageGb: 0,
        devicesOwned: 0,
      });
      expect(result.totalKgCO2PerYear).toBe(8 * DIGITAL_FACTORS.SCREEN_HOUR_DAILY);
      expect(result.breakdown.screenTime).toBe(8 * DIGITAL_FACTORS.SCREEN_HOUR_DAILY);
      expect(result.breakdown.streaming).toBe(0);
      expect(result.breakdown.cloud).toBe(0);
      expect(result.breakdown.devices).toBe(0);
    });

    it("should calculate streaming isolation", () => {
      const result = calculateDigital({
        screenHoursPerDay: 0,
        streamingHoursPerDay: 4,
        cloudStorageGb: 0,
        devicesOwned: 0,
      });
      expect(result.totalKgCO2PerYear).toBe(4 * DIGITAL_FACTORS.STREAMING_HOUR_DAILY);
    });

    it("should calculate cloud storage isolation", () => {
      const result = calculateDigital({
        screenHoursPerDay: 0,
        streamingHoursPerDay: 0,
        cloudStorageGb: 1000,
        devicesOwned: 0,
      });
      expect(result.totalKgCO2PerYear).toBe(1000 * DIGITAL_FACTORS.CLOUD_STORAGE_GB_ANNUAL);
    });

    it("should calculate device emissions isolation", () => {
      const result = calculateDigital({
        screenHoursPerDay: 0,
        streamingHoursPerDay: 0,
        cloudStorageGb: 0,
        devicesOwned: 10,
      });
      expect(result.totalKgCO2PerYear).toBe(10 * DIGITAL_FACTORS.DEVICE_ANNUAL);
    });

    it("should scale linearly with heavy usage", () => {
      const light = calculateDigital({
        screenHoursPerDay: 1,
        streamingHoursPerDay: 1,
        cloudStorageGb: 100,
        devicesOwned: 1,
      });
      const heavy = calculateDigital({
        screenHoursPerDay: 2,
        streamingHoursPerDay: 2,
        cloudStorageGb: 200,
        devicesOwned: 2,
      });
      expect(heavy.totalKgCO2PerYear).toBeCloseTo(light.totalKgCO2PerYear * 2, 2);
    });
  });

  // ─── Emission Category Tests ─────────────────────────────────────────────
  describe("getEmissionCategory", () => {
    it("should categorize emission levels correctly", () => {
      expect(getEmissionCategory(2.5)).toBe("LOW");
      expect(getEmissionCategory(6.1)).toBe("MODERATE");
      expect(getEmissionCategory(10.5)).toBe("HIGH");
      expect(getEmissionCategory(14.2)).toBe("VERY_HIGH");
    });

    it("should handle exact boundary values", () => {
      expect(getEmissionCategory(0)).toBe("LOW");
      expect(getEmissionCategory(3.99)).toBe("LOW");
      expect(getEmissionCategory(4)).toBe("MODERATE");
      expect(getEmissionCategory(7.99)).toBe("MODERATE");
      expect(getEmissionCategory(8)).toBe("HIGH");
      expect(getEmissionCategory(11.99)).toBe("HIGH");
      expect(getEmissionCategory(12)).toBe("VERY_HIGH");
    });

    it("should handle extreme values", () => {
      expect(getEmissionCategory(100)).toBe("VERY_HIGH");
      expect(getEmissionCategory(0.001)).toBe("LOW");
    });
  });

  // ─── Full Profile Aggregation Tests ───────────────────────────────────────
  describe("calculateCarbonProfile", () => {
    const sampleData: AssessmentData = {
      transport: {
        commuteMode: "CAR_PETROL",
        commuteDistanceKm: 15,
        commuteDaysPerWeek: 5,
        shortFlightsPerYear: 2,
        longFlightsPerYear: 1,
      },
      food: {
        dietType: "MEAT_MODERATE",
        localFoodPercentage: 30,
        foodWastePercentage: 15,
        mealsOutPerWeek: 3,
      },
      energy: {
        electricityKwhPerMonth: 250,
        heatingType: "NATURAL_GAS",
        gasKwhPerMonth: 100,
        renewablePercentage: 10,
        householdSize: 2,
      },
      shopping: {
        clothingItemsPerYear: 12,
        electronicsPerYear: 3,
        furniturePerYear: 1,
        secondhandPercentage: 20,
      },
      digital: {
        screenHoursPerDay: 6,
        streamingHoursPerDay: 2,
        cloudStorageGb: 100,
        devicesOwned: 4,
      },
    };

    it("should compile profiles and convert kg to tonnes correctly", () => {
      const profile = calculateCarbonProfile(sampleData);

      expect(profile.totalEmissions).toBeGreaterThan(0);
      expect(profile.transportEmissions).toBeCloseTo(3.638, 3);
      expect(profile.category).toBeDefined();
      expect(profile.breakdown.food.totalKgCO2PerYear).toBeGreaterThan(0);
      expect(profile.breakdown.energy.totalKgCO2PerYear).toBeGreaterThan(0);
      expect(profile.breakdown.shopping.totalKgCO2PerYear).toBeGreaterThan(0);
      expect(profile.breakdown.digital.totalKgCO2PerYear).toBeGreaterThan(0);
    });

    it("should have total equal to sum of all categories", () => {
      const profile = calculateCarbonProfile(sampleData);
      const sum =
        profile.transportEmissions +
        profile.foodEmissions +
        profile.energyEmissions +
        profile.shoppingEmissions +
        profile.digitalEmissions;
      expect(profile.totalEmissions).toBeCloseTo(sum, 6);
    });

    it("should return all category breakdowns", () => {
      const profile = calculateCarbonProfile(sampleData);
      expect(profile.breakdown).toHaveProperty("transport");
      expect(profile.breakdown).toHaveProperty("food");
      expect(profile.breakdown).toHaveProperty("energy");
      expect(profile.breakdown).toHaveProperty("shopping");
      expect(profile.breakdown).toHaveProperty("digital");
    });

    it("should assign a valid emission category", () => {
      const profile = calculateCarbonProfile(sampleData);
      expect(["LOW", "MODERATE", "HIGH", "VERY_HIGH"]).toContain(profile.category);
    });

    it("should handle zero-impact lifestyle", () => {
      const zeroData: AssessmentData = {
        transport: {
          commuteMode: "BICYCLE",
          commuteDistanceKm: 0,
          commuteDaysPerWeek: 0,
          shortFlightsPerYear: 0,
          longFlightsPerYear: 0,
        },
        food: {
          dietType: "VEGAN",
          localFoodPercentage: 100,
          foodWastePercentage: 0,
          mealsOutPerWeek: 0,
        },
        energy: {
          electricityKwhPerMonth: 0,
          heatingType: "HEAT_PUMP",
          gasKwhPerMonth: 0,
          renewablePercentage: 100,
          householdSize: 1,
        },
        shopping: {
          clothingItemsPerYear: 0,
          electronicsPerYear: 0,
          furniturePerYear: 0,
          secondhandPercentage: 100,
        },
        digital: {
          screenHoursPerDay: 0,
          streamingHoursPerDay: 0,
          cloudStorageGb: 0,
          devicesOwned: 0,
        },
      };
      const profile = calculateCarbonProfile(zeroData);
      // Even minimal lifestyle has heating base
      expect(profile.totalEmissions).toBeGreaterThanOrEqual(0);
      expect(profile.category).toBe("LOW");
    });

    it("should categorize high-impact lifestyle as VERY_HIGH", () => {
      const highData: AssessmentData = {
        transport: {
          commuteMode: "CAR_PETROL",
          commuteDistanceKm: 50,
          commuteDaysPerWeek: 7,
          shortFlightsPerYear: 20,
          longFlightsPerYear: 10,
        },
        food: {
          dietType: "MEAT_HEAVY",
          localFoodPercentage: 0,
          foodWastePercentage: 100,
          mealsOutPerWeek: 14,
        },
        energy: {
          electricityKwhPerMonth: 1000,
          heatingType: "OIL",
          gasKwhPerMonth: 500,
          renewablePercentage: 0,
          householdSize: 1,
        },
        shopping: {
          clothingItemsPerYear: 50,
          electronicsPerYear: 10,
          furniturePerYear: 5,
          secondhandPercentage: 0,
        },
        digital: {
          screenHoursPerDay: 16,
          streamingHoursPerDay: 8,
          cloudStorageGb: 5000,
          devicesOwned: 10,
        },
      };
      const profile = calculateCarbonProfile(highData);
      expect(profile.totalEmissions).toBeGreaterThan(12);
      expect(profile.category).toBe("VERY_HIGH");
    });
  });
});
