"use client";

import React, { useState, useTransition } from "react";
import { 
  Car, Bike, Plane, Flame, ShoppingBag, 
  Laptop, Utensils, Check, ArrowLeft, ArrowRight, 
  Sparkles, Cloud, Monitor, Lightbulb, Zap, User, 
  Trash2, Footprints, Moon, Sun, Loader2, Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { submitAssessment } from "./actions";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, name: "Transport", desc: "Commute & Travel" },
  { id: 2, name: "Food", desc: "Diet & Waste" },
  { id: 3, name: "Energy", desc: "Household & Fuel" },
  { id: 4, name: "Shopping", desc: "Goods & Secondhand" },
  { id: 5, name: "Digital", desc: "Devices & Usage" },
];

export default function AssessmentPage() {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
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
    }
  });

  const updateField = (category: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const nextStep = () => {
    setError(null);
    // Basic local validation
    if (step === 3 && formData.energy.householdSize < 1) {
      setError("Household size must be at least 1.");
      return;
    }
    setStep(prev => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => {
    setError(null);
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    startTransition(async () => {
      const result = await submitAssessment(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl flex-1 flex flex-col justify-center">
      {/* Step Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="px-3 py-1 text-sm bg-primary/5 text-primary border-primary/20">
            Step {step} of 5: {steps[step - 1].name}
          </Badge>
          <span className="text-sm text-muted-foreground font-medium">
            {Math.round(((step - 1) / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / steps.length) * 100}%` }}
          />
        </div>
        <div className="grid grid-cols-5 gap-2 mt-2 text-center text-[10px] sm:text-xs font-semibold text-muted-foreground">
          {steps.map(s => (
            <div 
              key={s.id} 
              className={cn(
                "transition-colors",
                s.id <= step ? "text-foreground font-bold" : "text-muted-foreground/60"
              )}
            >
              {s.name}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-destructive animate-ping shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
        {/* Step 1: Transport */}
        {step === 1 && (
          <Card className="border-primary/10 shadow-lg bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Car className="h-6 w-6 text-primary" />
                Transport Profile
              </CardTitle>
              <CardDescription>
                Tell us about your daily commute and long-distance travel habits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3">Primary Commute Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "CAR_PETROL", label: "Petrol Car", icon: Car },
                    { id: "CAR_DIESEL", label: "Diesel Car", icon: Car },
                    { id: "CAR_HYBRID", label: "Hybrid Car", icon: Car },
                    { id: "CAR_ELECTRIC", label: "Electric Car", icon: Zap },
                    { id: "BUS", label: "Bus", icon: Navigation },
                    { id: "TRAIN", label: "Train/Metro", icon: Footprints },
                    { id: "MOTORCYCLE", label: "Motorcycle", icon: Flame },
                    { id: "BICYCLE", label: "Bicycle", icon: Bike },
                    { id: "WALKING", label: "Walking", icon: User },
                  ].map(mode => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => updateField("transport", "commuteMode", mode.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 border rounded-xl transition-all cursor-pointer text-center gap-2 group h-24",
                        formData.transport.commuteMode === mode.id
                          ? "border-primary bg-primary/10 ring-2 ring-primary/50 text-foreground"
                          : "border-border bg-background/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <mode.icon className={cn(
                        "h-6 w-6 transition-transform group-hover:scale-110",
                        formData.transport.commuteMode === mode.id ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="text-xs font-semibold">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formData.transport.commuteMode !== "BICYCLE" && formData.transport.commuteMode !== "WALKING" && (
                <div className="grid sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <label htmlFor="commuteDistanceKm" className="font-semibold text-muted-foreground">Commute Distance (One Way)</label>
                      <span className="font-bold text-primary">{formData.transport.commuteDistanceKm} km</span>
                    </div>
                    <input 
                      id="commuteDistanceKm"
                      type="range" 
                      min="0" 
                      max="150" 
                      value={formData.transport.commuteDistanceKm}
                      onChange={(e) => updateField("transport", "commuteDistanceKm", parseInt(e.target.value))}
                      className="w-full accent-primary bg-muted rounded-lg h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <label htmlFor="commuteDaysPerWeek" className="font-semibold text-muted-foreground">Commute Days / Week</label>
                      <span className="font-bold text-primary">{formData.transport.commuteDaysPerWeek} days</span>
                    </div>
                    <input 
                      id="commuteDaysPerWeek"
                      type="range" 
                      min="0" 
                      max="7" 
                      value={formData.transport.commuteDaysPerWeek}
                      onChange={(e) => updateField("transport", "commuteDaysPerWeek", parseInt(e.target.value))}
                      className="w-full accent-primary bg-muted rounded-lg h-2"
                    />
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <label htmlFor="shortFlights" className="font-semibold text-muted-foreground">Short-haul flights per year (&lt; 3 hours)</label>
                    <span className="font-bold text-primary">{formData.transport.shortFlightsPerYear} flights</span>
                  </div>
                  <input 
                    id="shortFlights"
                    type="range" 
                    min="0" 
                    max="20" 
                    value={formData.transport.shortFlightsPerYear}
                    onChange={(e) => updateField("transport", "shortFlightsPerYear", parseInt(e.target.value))}
                    className="w-full accent-primary bg-muted rounded-lg h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <label htmlFor="longFlights" className="font-semibold text-muted-foreground">Long-haul flights per year (&gt; 3 hours)</label>
                    <span className="font-bold text-primary">{formData.transport.longFlightsPerYear} flights</span>
                  </div>
                  <input 
                    id="longFlights"
                    type="range" 
                    min="0" 
                    max="20" 
                    value={formData.transport.longFlightsPerYear}
                    onChange={(e) => updateField("transport", "longFlightsPerYear", parseInt(e.target.value))}
                    className="w-full accent-primary bg-muted rounded-lg h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Food */}
        {step === 2 && (
          <Card className="border-primary/10 shadow-lg bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Utensils className="h-6 w-6 text-primary" />
                Food & Diet Profile
              </CardTitle>
              <CardDescription>
                Tell us about your eating habits and how you source your food.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3">Diet Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "VEGAN", label: "Vegan", desc: "No animal products", icon: Check },
                    { id: "VEGETARIAN", label: "Vegetarian", desc: "No meat, yes dairy/eggs", icon: Check },
                    { id: "PESCATARIAN", label: "Pescatarian", desc: "Seafood but no poultry/red meat", icon: Check },
                    { id: "FLEXITARIAN", label: "Flexitarian", desc: "Mostly vegetarian, occasional meat", icon: Check },
                    { id: "MEAT_MODERATE", label: "Moderate Meat", desc: "Average poultry/meat consumption", icon: Check },
                    { id: "MEAT_HEAVY", label: "Heavy Meat", desc: "Meat almost daily/heavy red meat", icon: Check },
                  ].map(diet => (
                    <button
                      key={diet.id}
                      type="button"
                      onClick={() => updateField("food", "dietType", diet.id)}
                      className={cn(
                        "flex flex-col p-3 border rounded-xl transition-all cursor-pointer text-left gap-1.5 group h-24 justify-center relative",
                        formData.food.dietType === diet.id
                          ? "border-primary bg-primary/10 ring-2 ring-primary/50 text-foreground"
                          : "border-border bg-background/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {formData.food.dietType === diet.id && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground p-0.5 rounded-full">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      <span className="text-sm font-bold text-foreground">{diet.label}</span>
                      <span className="text-xs text-muted-foreground leading-normal">{diet.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label htmlFor="localFood" className="font-semibold text-muted-foreground">Locally Sourced Food</label>
                  <span className="font-bold text-primary">{formData.food.localFoodPercentage}%</span>
                </div>
                <input 
                  id="localFood"
                  type="range" 
                  min="0" 
                  max="100" 
                  value={formData.food.localFoodPercentage}
                  onChange={(e) => updateField("food", "localFoodPercentage", parseInt(e.target.value))}
                  className="w-full accent-primary bg-muted rounded-lg h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label htmlFor="foodWaste" className="font-semibold text-muted-foreground">Food Waste Percentage</label>
                  <span className="font-bold text-primary">{formData.food.foodWastePercentage}%</span>
                </div>
                <input 
                  id="foodWaste"
                  type="range" 
                  min="0" 
                  max="100" 
                  value={formData.food.foodWastePercentage}
                  onChange={(e) => updateField("food", "foodWastePercentage", parseInt(e.target.value))}
                  className="w-full accent-primary bg-muted rounded-lg h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label htmlFor="mealsOut" className="font-semibold text-muted-foreground">Meals Dining Out per Week</label>
                  <span className="font-bold text-primary">{formData.food.mealsOutPerWeek} meals</span>
                </div>
                <input 
                  id="mealsOut"
                  type="range" 
                  min="0" 
                  max="21" 
                  value={formData.food.mealsOutPerWeek}
                  onChange={(e) => updateField("food", "mealsOutPerWeek", parseInt(e.target.value))}
                  className="w-full accent-primary bg-muted rounded-lg h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Energy */}
        {step === 3 && (
          <Card className="border-primary/10 shadow-lg bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-primary" />
                Household Energy
              </CardTitle>
              <CardDescription>
                Provide details about your household utility consumption and heating.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="electricityKwh" className="text-sm font-semibold text-muted-foreground">Monthly Electricity (kWh)</label>
                  <Input 
                    id="electricityKwh"
                    type="number"
                    min="0"
                    value={formData.energy.electricityKwhPerMonth || ""}
                    onChange={(e) => updateField("energy", "electricityKwhPerMonth", parseInt(e.target.value) || 0)}
                    className="h-12 bg-background/50 border-primary/10 text-base"
                    placeholder="e.g. 250"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="householdSize" className="text-sm font-semibold text-muted-foreground">Household Size (People)</label>
                  <Input 
                    id="householdSize"
                    type="number"
                    min="1"
                    value={formData.energy.householdSize || ""}
                    onChange={(e) => updateField("energy", "householdSize", parseInt(e.target.value) || 0)}
                    className="h-12 bg-background/50 border-primary/10 text-base"
                    placeholder="e.g. 2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3">Primary Heating Source</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "NATURAL_GAS", label: "Natural Gas", icon: Flame },
                    { id: "ELECTRIC", label: "Electric Heater", icon: Zap },
                    { id: "OIL", label: "Heating Oil", icon: Trash2 },
                    { id: "HEAT_PUMP", label: "Heat Pump", icon: Sparkles },
                    { id: "WOOD", label: "Wood Stove", icon: Flame },
                  ].map(heat => (
                    <button
                      key={heat.id}
                      type="button"
                      onClick={() => updateField("energy", "heatingType", heat.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 border rounded-xl transition-all cursor-pointer text-center gap-1.5 group h-22",
                        formData.energy.heatingType === heat.id
                          ? "border-primary bg-primary/10 ring-2 ring-primary/50 text-foreground"
                          : "border-border bg-background/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <heat.icon className={cn(
                        "h-5 w-5 transition-transform group-hover:scale-110",
                        formData.energy.heatingType === heat.id ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="text-xs font-semibold leading-tight">{heat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formData.energy.heatingType === "NATURAL_GAS" && (
                <div className="space-y-2">
                  <label htmlFor="gasKwh" className="text-sm font-semibold text-muted-foreground">Monthly Gas Usage (kWh)</label>
                  <Input 
                    id="gasKwh"
                    type="number"
                    min="0"
                    value={formData.energy.gasKwhPerMonth || ""}
                    onChange={(e) => updateField("energy", "gasKwhPerMonth", parseInt(e.target.value) || 0)}
                    className="h-12 bg-background/50 border-primary/10 text-base"
                    placeholder="e.g. 100"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label htmlFor="renewable" className="font-semibold text-muted-foreground">Renewable Energy Share</label>
                  <span className="font-bold text-primary">{formData.energy.renewablePercentage}%</span>
                </div>
                <input 
                  id="renewable"
                  type="range" 
                  min="0" 
                  max="100" 
                  value={formData.energy.renewablePercentage}
                  onChange={(e) => updateField("energy", "renewablePercentage", parseInt(e.target.value))}
                  className="w-full accent-primary bg-muted rounded-lg h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Shopping */}
        {step === 4 && (
          <Card className="border-primary/10 shadow-lg bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <ShoppingBag className="h-6 w-6 text-primary" />
                Consumption & Shopping
              </CardTitle>
              <CardDescription>
                Help us evaluate the carbon footprint of your purchases.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="clothes" className="text-sm font-semibold text-muted-foreground">Clothing Items / Year</label>
                  <Input 
                    id="clothes"
                    type="number"
                    min="0"
                    value={formData.shopping.clothingItemsPerYear || ""}
                    onChange={(e) => updateField("shopping", "clothingItemsPerYear", parseInt(e.target.value) || 0)}
                    className="h-12 bg-background/50 border-primary/10 text-base"
                    placeholder="e.g. 12"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="electronics" className="text-sm font-semibold text-muted-foreground">Electronics / Year</label>
                  <Input 
                    id="electronics"
                    type="number"
                    min="0"
                    value={formData.shopping.electronicsPerYear || ""}
                    onChange={(e) => updateField("shopping", "electronicsPerYear", parseInt(e.target.value) || 0)}
                    className="h-12 bg-background/50 border-primary/10 text-base"
                    placeholder="e.g. 3"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="furniture" className="text-sm font-semibold text-muted-foreground">Furniture / Year</label>
                  <Input 
                    id="furniture"
                    type="number"
                    min="0"
                    value={formData.shopping.furniturePerYear || ""}
                    onChange={(e) => updateField("shopping", "furniturePerYear", parseInt(e.target.value) || 0)}
                    className="h-12 bg-background/50 border-primary/10 text-base"
                    placeholder="e.g. 1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label htmlFor="secondhand" className="font-semibold text-muted-foreground">Secondhand Purchases Share</label>
                  <span className="font-bold text-primary">{formData.shopping.secondhandPercentage}%</span>
                </div>
                <input 
                  id="secondhand"
                  type="range" 
                  min="0" 
                  max="100" 
                  value={formData.shopping.secondhandPercentage}
                  onChange={(e) => updateField("shopping", "secondhandPercentage", parseInt(e.target.value))}
                  className="w-full accent-primary bg-muted rounded-lg h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Digital */}
        {step === 5 && (
          <Card className="border-primary/10 shadow-lg bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Laptop className="h-6 w-6 text-primary" />
                Digital Footprint
              </CardTitle>
              <CardDescription>
                Estimate your internet usage, digital consumption, and hardware inventory.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <label htmlFor="screenHours" className="font-semibold text-muted-foreground">Daily Screen Time</label>
                    <span className="font-bold text-primary">{formData.digital.screenHoursPerDay} hrs</span>
                  </div>
                  <input 
                    id="screenHours"
                    type="range" 
                    min="0" 
                    max="24" 
                    value={formData.digital.screenHoursPerDay}
                    onChange={(e) => updateField("digital", "screenHoursPerDay", parseInt(e.target.value))}
                    className="w-full accent-primary bg-muted rounded-lg h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <label htmlFor="streamingHours" className="font-semibold text-muted-foreground">Daily Video Streaming</label>
                    <span className="font-bold text-primary">{formData.digital.streamingHoursPerDay} hrs</span>
                  </div>
                  <input 
                    id="streamingHours"
                    type="range" 
                    min="0" 
                    max="24" 
                    value={formData.digital.streamingHoursPerDay}
                    onChange={(e) => updateField("digital", "streamingHoursPerDay", parseInt(e.target.value))}
                    className="w-full accent-primary bg-muted rounded-lg h-2"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label htmlFor="cloudStorage" className="text-sm font-semibold text-muted-foreground">Cloud Storage Used (GB)</label>
                  <Input 
                    id="cloudStorage"
                    type="number"
                    min="0"
                    value={formData.digital.cloudStorageGb || ""}
                    onChange={(e) => updateField("digital", "cloudStorageGb", parseInt(e.target.value) || 0)}
                    className="h-12 bg-background/50 border-primary/10 text-base"
                    placeholder="e.g. 100"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="devices" className="text-sm font-semibold text-muted-foreground">Hardware Devices Owned</label>
                  <Input 
                    id="devices"
                    type="number"
                    min="0"
                    value={formData.digital.devicesOwned || ""}
                    onChange={(e) => updateField("digital", "devicesOwned", parseInt(e.target.value) || 0)}
                    className="h-12 bg-background/50 border-primary/10 text-base"
                    placeholder="e.g. 4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 flex justify-between gap-4">
          {step > 1 ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep}
              className="h-12 px-6 rounded-xl border-primary/10 hover:bg-muted text-base shrink-0 flex items-center gap-2"
              disabled={isPending}
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <Button 
              type="button" 
              onClick={nextStep}
              className="h-12 px-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-base flex items-center gap-2 ml-auto shadow-md"
            >
              Next Step
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={isPending}
              className="h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-base flex items-center gap-2 ml-auto shadow-md"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  Calculate Footprint
                  <Sparkles className="h-4 w-4 text-emerald-300" />
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
