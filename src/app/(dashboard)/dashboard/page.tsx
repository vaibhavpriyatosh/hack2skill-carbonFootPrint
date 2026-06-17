import { auth } from "@/auth";
import { prisma } from "@/lib/prisma/client";
import Link from "next/link";
import {
  Leaf, ArrowRight, BarChart3, AlertCircle, Car, Utensils,
  Zap, ShoppingBag, Laptop, TrendingDown, TrendingUp,
  Target, Sparkles, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmissionChart } from "@/components/dashboard/EmissionChart";
import { RefreshButton } from "@/components/dashboard/RefreshButton";

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  TRANSPORT: { label: "Transport", icon: Car, color: "text-blue-400", bg: "bg-blue-500/10" },
  FOOD: { label: "Food & Diet", icon: Utensils, color: "text-orange-400", bg: "bg-orange-500/10" },
  ENERGY: { label: "Energy", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  SHOPPING: { label: "Shopping", icon: ShoppingBag, color: "text-purple-400", bg: "bg-purple-500/10" },
  DIGITAL: { label: "Digital", icon: Laptop, color: "text-cyan-400", bg: "bg-cyan-500/10" },
};

const DIFFICULTY_META = {
  EASY: { label: "Easy", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  MODERATE: { label: "Moderate", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  HARD: { label: "Hard", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
};

const STATUS_META = {
  PENDING: { label: "Pending", icon: Clock, color: "text-muted-foreground" },
  ACCEPTED: { label: "Accepted", icon: CheckCircle2, color: "text-emerald-400" },
  COMPLETED: { label: "Done", icon: CheckCircle2, color: "text-emerald-400" },
  DISMISSED: { label: "Dismissed", icon: XCircle, color: "text-muted-foreground" },
};

const EMISSION_CATEGORY_META = {
  LOW: { label: "Low Emitter 🌱", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", compare: "below global average" },
  MODERATE: { label: "Moderate Emitter 🌿", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", compare: "near global average" },
  HIGH: { label: "High Emitter ⚠️", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", compare: "above global average" },
  VERY_HIGH: { label: "Very High Emitter 🔥", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", compare: "well above global average" },
};

export default async function DashboardPage() {
  const session = await auth();

  const [latestProfile, recommendations, allProfiles] = await Promise.all([
    prisma.carbonProfile.findFirst({
      where: { userId: session?.user?.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.recommendation.findMany({
      where: { userId: session?.user?.id },
      orderBy: [{ potentialReduction: "desc" }],
      take: 6,
    }),
    prisma.carbonProfile.findMany({
      where: { userId: session?.user?.id },
      orderBy: { createdAt: "asc" },
      select: { totalEmissions: true, createdAt: true },
    }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, <span className="text-primary">{session?.user?.name?.split(" ")[0]}</span>!
            </h1>
            <p className="text-muted-foreground mt-1">
              {latestProfile
                ? "Here's your environmental impact summary."
                : "Start your first assessment to see your carbon footprint."}
            </p>
          </div>
          {latestProfile && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="border-primary/20 hover:bg-primary/5 gap-2"
                render={<Link href="/assessment" />}
                nativeButton={false}
              >
                <ArrowRight className="h-4 w-4" />
                Retake Assessment
              </Button>
              <RefreshButton />
            </div>
          )}
        </div>

        {/* No profile state */}
        {!latestProfile ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <CardTitle>No Carbon Profile Yet</CardTitle>
              </div>
              <CardDescription className="text-base text-foreground/80">
                Take the 5-step assessment to discover your annual carbon footprint and get personalised AI recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                className="gap-2 shadow-md shadow-primary/20"
                render={<Link href="/assessment" />}
                nativeButton={false}
              >
                Start Your Assessment
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total emissions */}
              <Card className="lg:col-span-1 border-primary/10 bg-card/80">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" /> Total Emissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {latestProfile.totalEmissions.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">tonnes CO₂e / year</div>
                  <Badge
                    variant="outline"
                    className={`mt-3 text-xs font-medium ${EMISSION_CATEGORY_META[latestProfile.category as keyof typeof EMISSION_CATEGORY_META].bg} ${EMISSION_CATEGORY_META[latestProfile.category as keyof typeof EMISSION_CATEGORY_META].color} border`}
                  >
                    {EMISSION_CATEGORY_META[latestProfile.category as keyof typeof EMISSION_CATEGORY_META].label}
                  </Badge>
                </CardContent>
              </Card>

              {/* Highest category */}
              {(() => {
                const cats = [
                  { key: "TRANSPORT", val: latestProfile.transportEmissions },
                  { key: "FOOD", val: latestProfile.foodEmissions },
                  { key: "ENERGY", val: latestProfile.energyEmissions },
                  { key: "SHOPPING", val: latestProfile.shoppingEmissions },
                  { key: "DIGITAL", val: latestProfile.digitalEmissions },
                ];
                const highest = cats.reduce((a, b) => (a.val > b.val ? a : b));
                const meta = CATEGORY_META[highest.key];
                const Icon = meta.icon;
                return (
                  <Card className="border-primary/10 bg-card/80">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-red-400" /> Biggest Source
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className={`flex items-center gap-2 mb-1 ${meta.color}`}>
                        <div className={`p-1.5 rounded-lg ${meta.bg}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-lg text-foreground">{meta.label}</span>
                      </div>
                      <div className="text-2xl font-bold">{highest.val.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground mt-1">tonnes CO₂e / year</div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Global comparison */}
              <Card className="border-primary/10 bg-card/80">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" /> vs. Global Average
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {latestProfile.totalEmissions > 4.7
                      ? `+${(latestProfile.totalEmissions - 4.7).toFixed(1)}`
                      : `-${(4.7 - latestProfile.totalEmissions).toFixed(1)}`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">vs 4.7t global avg</div>
                  <div className={`text-xs mt-2 font-medium ${latestProfile.totalEmissions <= 4.7 ? "text-emerald-400" : "text-orange-400"}`}>
                    {latestProfile.totalEmissions <= 4.7 ? (
                      <span className="flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Below average 🎉</span>
                    ) : (
                      <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Above average</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* AI recommendations count */}
              <Card className="border-primary/10 bg-card/80">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{recommendations.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">personalised actions</div>
                  <div className="text-xs text-primary mt-2 font-medium">
                    Save up to {recommendations.reduce((s, r) => s + r.potentialReduction, 0).toFixed(1)}t CO₂e/year
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts row */}
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Emission breakdown donut / bar */}
              <Card className="lg:col-span-3 border-primary/10 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-base">Emission Breakdown</CardTitle>
                  <CardDescription>Your CO₂e emissions by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmissionChart
                    data={[
                      { name: "Transport", value: latestProfile.transportEmissions, color: "#60a5fa" },
                      { name: "Food", value: latestProfile.foodEmissions, color: "#fb923c" },
                      { name: "Energy", value: latestProfile.energyEmissions, color: "#facc15" },
                      { name: "Shopping", value: latestProfile.shoppingEmissions, color: "#c084fc" },
                      { name: "Digital", value: latestProfile.digitalEmissions, color: "#22d3ee" },
                    ]}
                  />
                </CardContent>
              </Card>

              {/* Category breakdown list */}
              <Card className="lg:col-span-2 border-primary/10 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-base">Category Details</CardTitle>
                  <CardDescription>Ranked by impact</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: "TRANSPORT", val: latestProfile.transportEmissions },
                    { key: "FOOD", val: latestProfile.foodEmissions },
                    { key: "ENERGY", val: latestProfile.energyEmissions },
                    { key: "SHOPPING", val: latestProfile.shoppingEmissions },
                    { key: "DIGITAL", val: latestProfile.digitalEmissions },
                  ]
                    .sort((a, b) => b.val - a.val)
                    .map(({ key, val }) => {
                      const meta = CATEGORY_META[key];
                      const Icon = meta.icon;
                      const pct = ((val / latestProfile.totalEmissions) * 100).toFixed(0);
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg shrink-0 ${meta.bg}`}>
                            <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-foreground">{meta.label}</span>
                              <span className="text-muted-foreground">{val.toFixed(2)}t</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all`}
                                style={{ width: `${pct}%`, backgroundColor: meta.color.replace("text-", "").includes("blue") ? "#60a5fa" : meta.color.includes("orange") ? "#fb923c" : meta.color.includes("yellow") ? "#facc15" : meta.color.includes("purple") ? "#c084fc" : "#22d3ee" }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{pct}%</span>
                        </div>
                      );
                    })}
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold tracking-tight">AI Recommendations</h2>
                {recommendations.length === 0 && (
                  <Badge variant="outline" className="text-xs text-muted-foreground border-muted">Generating…</Badge>
                )}
              </div>

              {recommendations.length === 0 ? (
                <Card className="border-dashed border-primary/20 bg-primary/5">
                  <CardContent className="py-10 text-center">
                    <Sparkles className="h-8 w-8 text-primary/40 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      AI recommendations are being generated. Refresh in a few seconds.
                    </p>
                  <RefreshButton className="mt-4" />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recommendations.map((rec) => {
                    const catMeta = CATEGORY_META[rec.category];
                    const diffMeta = DIFFICULTY_META[rec.difficulty];
                    const Icon = catMeta.icon;
                    return (
                      <Card
                        key={rec.id}
                        className="border-primary/10 bg-card/80 hover:border-primary/30 hover:bg-card transition-all duration-200"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className={`p-2 rounded-xl ${catMeta.bg} shrink-0`}>
                              <Icon className={`h-4 w-4 ${catMeta.color}`} />
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold px-2 py-0.5 ${diffMeta.bg} ${diffMeta.color}`}
                            >
                              {diffMeta.label}
                            </Badge>
                          </div>
                          <CardTitle className="text-sm font-semibold leading-snug mt-2">
                            {rec.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {rec.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                            <TrendingDown className="h-3.5 w-3.5" />
                            Save ~{rec.potentialReduction.toFixed(2)}t CO₂e/year
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* History hint */}
            {allProfiles.length > 1 && (
              <Card className="border-primary/10 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-base">Assessment History</CardTitle>
                  <CardDescription>You&apos;ve taken {allProfiles.length} assessments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 flex-wrap">
                    {allProfiles.map((p, i) => (
                      <div key={i} className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                        <div className="font-semibold text-foreground">{p.totalEmissions.toFixed(2)}t</div>
                        <div>{new Date(p.createdAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
