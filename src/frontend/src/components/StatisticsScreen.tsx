import {
  ArrowLeft,
  BarChart2,
  Droplets,
  Dumbbell,
  Pill,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  type ExtendedDayEntry,
  useGetAllEntries,
  useHydrationHistory,
} from "../hooks/useQueries";

interface StatisticsScreenProps {
  onBack: () => void;
}

function StatCard({
  label,
  value,
  sub,
}: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-card border border-border">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold font-display text-foreground leading-none">
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function StatisticsScreen({ onBack }: StatisticsScreenProps) {
  const { t } = useLanguage();
  const { data: entries = [], isLoading: loadingEntries } = useGetAllEntries();
  const { data: hydrationHistory = [], isLoading: loadingHydration } =
    useHydrationHistory();

  const isLoading = loadingEntries || loadingHydration;

  const months: string[] = t("months");
  const shortMonths = months.map((m: string) => m.slice(0, 3));

  const trainingStats = useMemo(() => {
    const trained = (entries as ExtendedDayEntry[]).filter((e) => e.trained);
    const total = trained.length;
    const currentYear = new Date().getFullYear();

    const thisYearCount = trained.filter((e) =>
      e.date.startsWith(String(currentYear)),
    ).length;

    const perMonth = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, "0");
      return trained.filter((e) => e.date.startsWith(`${currentYear}-${month}`))
        .length;
    });

    const maxMonth = Math.max(...perMonth, 1);

    let avgPerWeek = 0;
    let avgPerMonth = 0;
    let avgPerYear = 0;
    if (total > 0) {
      const sortedDates = trained.map((e) => e.date).sort();
      const firstDate = new Date(sortedDates[0]);
      const now = new Date();
      const diffMs = now.getTime() - firstDate.getTime();
      const diffWeeks = Math.max(1, diffMs / (7 * 24 * 60 * 60 * 1000));
      const diffMonths = Math.max(1, diffMs / (30.44 * 24 * 60 * 60 * 1000));
      const diffYears = Math.max(1, diffMs / (365.25 * 24 * 60 * 60 * 1000));
      avgPerWeek = total / diffWeeks;
      avgPerMonth = total / diffMonths;
      avgPerYear = total / diffYears;
    }

    const muscleCount: Record<string, number> = {};
    for (const e of trained) {
      for (const mg of e.muscleGroups) {
        muscleCount[mg] = (muscleCount[mg] ?? 0) + 1;
      }
    }
    const muscleGroups = Object.entries(muscleCount).sort(
      (a, b) => b[1] - a[1],
    );
    const maxMuscle = muscleGroups.length > 0 ? muscleGroups[0][1] : 1;

    return {
      total,
      thisYearCount,
      perMonth,
      maxMonth,
      avgPerWeek,
      avgPerMonth,
      avgPerYear,
      muscleGroups,
      maxMuscle,
    };
  }, [entries]);

  const hydrationStats = useMemo(() => {
    if (hydrationHistory.length === 0)
      return { avgPerWeek: 0, avgPerMonth: 0, avgPerYear: 0 };

    const totalMl = hydrationHistory.reduce(
      (sum, r) => sum + Number(r.totalMl),
      0,
    );
    const distinctWeeks = new Set(
      hydrationHistory.map((r) => {
        const d = new Date(r.date);
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil(
          ((d.getTime() - startOfYear.getTime()) / 86400000 +
            startOfYear.getDay() +
            1) /
            7,
        );
        return `${d.getFullYear()}-W${weekNum}`;
      }),
    ).size;
    const distinctMonths = new Set(
      hydrationHistory.map((r) => r.date.slice(0, 7)),
    ).size;
    const distinctYears = new Set(
      hydrationHistory.map((r) => r.date.slice(0, 4)),
    ).size;

    return {
      avgPerWeek: totalMl / Math.max(1, distinctWeeks),
      avgPerMonth: totalMl / Math.max(1, distinctMonths),
      avgPerYear: totalMl / Math.max(1, distinctYears),
    };
  }, [hydrationHistory]);

  const supplementStats = useMemo(() => {
    const typedEntries = entries as ExtendedDayEntry[];

    // Count entries based on actual gram values (not boolean flags)
    const creatineDaysCount = typedEntries.filter(
      (e) => Number(e.creatineGrams ?? 0) > 0,
    ).length;
    const proteinDaysCount = typedEntries.filter(
      (e) => Number(e.proteinGrams ?? 0) > 0,
    ).length;

    const totalCreatineG = typedEntries.reduce(
      (sum, e) => sum + Number(e.creatineGrams ?? 0),
      0,
    );
    const totalProteinG = typedEntries.reduce(
      (sum, e) => sum + Number(e.proteinGrams ?? 0),
      0,
    );

    let avgCreatinePerWeek = 0;
    let avgCreatinePerMonth = 0;
    let avgCreatinePerYear = 0;
    let avgProteinPerWeek = 0;
    let avgProteinPerMonth = 0;
    let avgProteinPerYear = 0;

    if (typedEntries.length > 0) {
      const sortedDates = typedEntries.map((e) => e.date).sort();
      const firstDate = new Date(sortedDates[0]);
      const now = new Date();
      const diffMs = now.getTime() - firstDate.getTime();
      const diffWeeks = Math.max(1, diffMs / (7 * 24 * 60 * 60 * 1000));
      const diffMonths = Math.max(1, diffMs / (30.44 * 24 * 60 * 60 * 1000));
      const diffYears = Math.max(1, diffMs / (365.25 * 24 * 60 * 60 * 1000));

      avgCreatinePerWeek = totalCreatineG / diffWeeks;
      avgCreatinePerMonth = totalCreatineG / diffMonths;
      avgCreatinePerYear = totalCreatineG / diffYears;
      avgProteinPerWeek = totalProteinG / diffWeeks;
      avgProteinPerMonth = totalProteinG / diffMonths;
      avgProteinPerYear = totalProteinG / diffYears;
    }

    return {
      creatineDays: creatineDaysCount,
      proteinDays: proteinDaysCount,
      totalCreatineG,
      totalProteinG,
      avgCreatinePerWeek,
      avgCreatinePerMonth,
      avgCreatinePerYear,
      avgProteinPerWeek,
      avgProteinPerMonth,
      avgProteinPerYear,
    };
  }, [entries]);

  const fmt = (n: number, decimals = 1) => n.toFixed(decimals);
  const fmtMl = (ml: number) =>
    ml >= 1000 ? `${fmt(ml / 1000)} L` : `${Math.round(ml)} ml`;
  const fmtG = (g: number) => `${Math.round(g)} g`;

  return (
    <div className="min-h-dvh bg-background flex flex-col max-w-[430px] mx-auto">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors press-scale"
          onClick={onBack}
          aria-label={t("back")}
          data-ocid="stats.secondary_button"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-muted-foreground" />
          <h1 className="text-base font-bold font-display text-foreground">
            {t("statisticsTitle")}
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-7">
        {isLoading ? (
          <div
            className="flex flex-col items-center justify-center py-20 gap-4"
            data-ocid="stats.loading_state"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        ) : entries.length === 0 && hydrationHistory.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 gap-3"
            data-ocid="stats.empty_state"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <BarChart2 size={26} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-[220px] leading-relaxed">
              {t("noData")}
            </p>
          </div>
        ) : (
          <>
            {/* Training Section */}
            <section data-ocid="stats.section">
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell size={15} className="text-muted-foreground" />
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("trainingFrequency")}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <StatCard
                  label={t("total")}
                  value={`${trainingStats.total}×`}
                  sub={t("allTime")}
                />
                <StatCard
                  label={t("thisYear")}
                  value={`${trainingStats.thisYearCount}×`}
                  sub={String(new Date().getFullYear())}
                />
                <StatCard
                  label={t("avgPerWeek")}
                  value={fmt(trainingStats.avgPerWeek)}
                  sub={t("trainings")}
                />
                <StatCard
                  label={t("avgPerMonth")}
                  value={fmt(trainingStats.avgPerMonth)}
                  sub={t("trainings")}
                />
              </div>
              <div className="mb-4">
                <StatCard
                  label={t("avgPerYear")}
                  value={fmt(trainingStats.avgPerYear)}
                  sub={t("trainings")}
                />
              </div>

              {/* Monthly bar chart */}
              <div className="px-4 py-4 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground mb-3">
                  {t("monthlyChart").replace(
                    "{0}",
                    String(new Date().getFullYear()),
                  )}
                </p>
                <div className="flex items-end gap-1 h-16">
                  {trainingStats.perMonth.map((count, i) => (
                    <div
                      key={shortMonths[i]}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full rounded-sm bg-primary transition-all duration-500"
                        style={{
                          height: `${Math.round((count / trainingStats.maxMonth) * 52)}px`,
                          minHeight: count > 0 ? "4px" : "0px",
                        }}
                      />
                      <span className="text-[8px] text-muted-foreground">
                        {shortMonths[i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Muscle Groups */}
            {trainingStats.muscleGroups.length > 0 && (
              <section data-ocid="stats.panel">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={15} className="text-muted-foreground" />
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("muscleGroupBreakdown")}
                  </h2>
                </div>
                <div className="px-4 py-4 rounded-xl bg-card border border-border space-y-2.5">
                  {trainingStats.muscleGroups.map(([name, count], i) => (
                    <div
                      key={name}
                      className="flex items-center gap-3"
                      data-ocid={`stats.item.${i + 1}`}
                    >
                      <span className="text-xs text-muted-foreground w-4 text-right">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {count}×
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{
                              width: `${(count / trainingStats.maxMuscle) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Hydration */}
            <section data-ocid="stats.card">
              <div className="flex items-center gap-2 mb-3">
                <Droplets size={15} className="text-muted-foreground" />
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("hydrationStats")}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  label={t("avgWeekly")}
                  value={fmtMl(hydrationStats.avgPerWeek)}
                />
                <StatCard
                  label={t("avgMonthly")}
                  value={fmtMl(hydrationStats.avgPerMonth)}
                />
              </div>
              <div className="mt-2">
                <StatCard
                  label={t("avgPerYear")}
                  value={fmtMl(hydrationStats.avgPerYear)}
                />
              </div>
            </section>

            {/* Supplements */}
            <section data-ocid="stats.panel">
              <div className="flex items-center gap-2 mb-3">
                <Pill size={15} className="text-muted-foreground" />
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("supplementStats")}
                </h2>
              </div>

              {/* Creatine */}
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2 px-1">
                  {t("creatineLabel")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard
                    label={t("creatineTotal")}
                    value={fmtG(supplementStats.totalCreatineG)}
                    sub={t("totalAmount")}
                  />
                  <StatCard
                    label={t("daysTaken")}
                    value={`${supplementStats.creatineDays}`}
                    sub={t("daysTotal")}
                  />
                  <StatCard
                    label={t("avgPerWeek")}
                    value={fmtG(supplementStats.avgCreatinePerWeek)}
                  />
                  <StatCard
                    label={t("avgPerMonth")}
                    value={fmtG(supplementStats.avgCreatinePerMonth)}
                  />
                </div>
                <div className="mt-2">
                  <StatCard
                    label={t("avgPerYear")}
                    value={fmtG(supplementStats.avgCreatinePerYear)}
                  />
                </div>
              </div>

              {/* Protein */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 px-1">
                  {t("proteinLabel")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard
                    label={t("proteinTotal")}
                    value={fmtG(supplementStats.totalProteinG)}
                    sub={t("totalAmount")}
                  />
                  <StatCard
                    label={t("daysTaken")}
                    value={`${supplementStats.proteinDays}`}
                    sub={t("daysTotal")}
                  />
                  <StatCard
                    label={t("avgPerWeek")}
                    value={fmtG(supplementStats.avgProteinPerWeek)}
                  />
                  <StatCard
                    label={t("avgPerMonth")}
                    value={fmtG(supplementStats.avgProteinPerMonth)}
                  />
                </div>
                <div className="mt-2">
                  <StatCard
                    label={t("avgPerYear")}
                    value={fmtG(supplementStats.avgProteinPerYear)}
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
