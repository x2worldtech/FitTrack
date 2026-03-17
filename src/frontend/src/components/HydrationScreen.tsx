import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  Droplets,
  Loader2,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import {
  useAddWaterIntake,
  useHydrationGoal,
  useHydrationHistory,
  useSaveHydrationGoal,
  useWaterIntake,
} from "../hooks/useQueries";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(dateStr: string) {
  const [y, m, day] = dateStr.split("-");
  return `${day}.${m}.${y}`;
}

interface WaterBottleProps {
  fillPercent: number;
  intakeMl: number;
  goalMl: number;
}

function WaterBottle({ fillPercent, intakeMl, goalMl }: WaterBottleProps) {
  const clampedFill = Math.min(100, Math.max(0, fillPercent));
  const bottleH = 280;
  const bottleW = 120;
  const fillAreaTop = 65;
  const fillAreaH = 185;
  const fillY = fillAreaTop + fillAreaH * (1 - clampedFill / 100);
  const fillH = fillAreaH * (clampedFill / 100);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={bottleW + 20}
        height={bottleH + 20}
        viewBox={`-10 -10 ${bottleW + 20} ${bottleH + 20}`}
        role="img"
        aria-labelledby="bottle-title"
      >
        <title id="bottle-title">Water bottle</title>
        <defs>
          <clipPath id="bottleClip">
            <path d="M 40 0 L 40 15 Q 30 20 25 35 L 20 55 Q 15 65 15 80 L 15 250 Q 15 265 30 265 L 90 265 Q 105 265 105 250 L 105 80 Q 105 65 100 55 L 95 35 Q 90 20 80 15 L 80 0 Z" />
          </clipPath>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="1" y2="0">
            <stop
              offset="0%"
              stopColor="oklch(0.58 0.18 220)"
              stopOpacity="0.85"
            />
            <stop
              offset="100%"
              stopColor="oklch(0.68 0.15 210)"
              stopOpacity="0.9"
            />
          </linearGradient>
          <linearGradient id="bottleGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.85 0 0)" />
            <stop offset="40%" stopColor="oklch(0.98 0 0)" />
            <stop offset="100%" stopColor="oklch(0.78 0 0)" />
          </linearGradient>
        </defs>

        <path
          d="M 40 0 L 40 15 Q 30 20 25 35 L 20 55 Q 15 65 15 80 L 15 250 Q 15 265 30 265 L 90 265 Q 105 265 105 250 L 105 80 Q 105 65 100 55 L 95 35 Q 90 20 80 15 L 80 0 Z"
          fill="url(#bottleGrad)"
          stroke="oklch(0.65 0 0)"
          strokeWidth="2"
        />

        <g clipPath="url(#bottleClip)">
          <rect
            x="0"
            y={fillY}
            width="120"
            height={fillH}
            fill="url(#waterGrad)"
            style={{ transition: "y 0.6s ease, height 0.6s ease" }}
          />
          {clampedFill > 0 && (
            <ellipse
              cx="60"
              cy={fillY}
              rx="45"
              ry="4"
              fill="oklch(0.75 0.12 210)"
              fillOpacity="0.6"
              style={{ transition: "cy 0.6s ease" }}
            />
          )}
        </g>

        <path
          d="M 40 0 L 40 15 Q 30 20 25 35 L 20 55 Q 15 65 15 80 L 15 250 Q 15 265 30 265 L 90 265 Q 105 265 105 250 L 105 80 Q 105 65 100 55 L 95 35 Q 90 20 80 15 L 80 0 Z"
          fill="none"
          stroke="oklch(0.40 0 0)"
          strokeWidth="2.5"
        />

        <rect
          x="36"
          y="-8"
          width="48"
          height="12"
          rx="4"
          fill="oklch(0.30 0 0)"
        />

        <text
          x="60"
          y="168"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="22"
          fontWeight="700"
          fill={clampedFill > 40 ? "oklch(0.98 0 0)" : "oklch(0.25 0 0)"}
          style={{ userSelect: "none" }}
        >
          {Math.round(clampedFill)}%
        </text>
      </svg>

      <p className="text-sm font-semibold text-foreground">
        <span className="text-lg">{intakeMl}</span>
        <span className="text-muted-foreground"> ml</span>
        {goalMl > 0 && (
          <>
            <span className="text-muted-foreground"> / </span>
            <span>{goalMl}</span>
            <span className="text-muted-foreground"> ml</span>
          </>
        )}
      </p>
    </div>
  );
}

interface HydrationScreenProps {
  onBack: () => void;
}

export default function HydrationScreen({ onBack }: HydrationScreenProps) {
  const today = todayKey();
  const { t } = useLanguage();
  const {
    data: goalData,
    isLoading: goalLoading,
    isError: goalError,
    refetch: refetchGoal,
  } = useHydrationGoal();
  const { data: intakeData } = useWaterIntake(today);
  const { data: history } = useHydrationHistory();
  const saveGoalMutation = useSaveHydrationGoal();
  const addWaterMutation = useAddWaterIntake();

  const goalMl = goalData !== undefined ? Number(goalData) : undefined;
  const intakeMl = intakeData ? Number(intakeData) : 0;
  const fillPercent = goalMl && goalMl > 0 ? (intakeMl / goalMl) * 100 : 0;

  const [goalInput, setGoalInput] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const handleSaveGoal = async () => {
    const ml = Number.parseInt(goalInput, 10);
    if (!ml || ml < 100) {
      toast.error(t("goalValidationError"));
      return;
    }
    try {
      await saveGoalMutation.mutateAsync(ml);
      setGoalInput("");
      setEditingGoal(false);
      toast.success(t("goalSaved").replace("{0}", String(ml)));
    } catch {
      toast.error(t("errorLoading"));
    }
  };

  const handleAddWater = async (amount: number) => {
    try {
      await addWaterMutation.mutateAsync({ date: today, amount });
      toast.success(t("waterAdded").replace("{0}", String(amount)));
    } catch {
      toast.error(t("errorLoading"));
    }
  };

  const handleManualAdd = async () => {
    const ml = Number.parseInt(manualInput, 10);
    if (!ml || ml < 1) {
      toast.error(t("manualValidationError"));
      return;
    }
    await handleAddWater(ml);
    setManualInput("");
  };

  const pastHistory = (history ?? []).filter((h) => h.date !== today);

  const isLoadingGoal = goalLoading && !goalError;
  const isGoalNotSet = !goalLoading && (goalMl === 0 || goalMl === undefined);
  const isGoalSet =
    !goalLoading && goalMl !== undefined && goalMl > 0 && !goalError;
  const showGoalForm = isGoalNotSet || editingGoal;

  return (
    <div className="min-h-dvh bg-background flex flex-col max-w-[430px] mx-auto">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          onClick={onBack}
          data-ocid="hydration.back_button"
          aria-label={t("back")}
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Droplets size={18} className="text-blue-400" />
          <h1 className="text-base font-bold font-display text-foreground">
            {t("hydrationTitle")}
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <section className="flex flex-col items-center pt-6 pb-4 px-4">
          <WaterBottle
            fillPercent={fillPercent}
            intakeMl={intakeMl}
            goalMl={goalMl ?? 0}
          />
        </section>

        <section className="px-4 pb-4">
          {isLoadingGoal ? (
            <div
              className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
              data-ocid="hydration.loading_state"
            >
              <Loader2 size={16} className="animate-spin" />
              <span>{t("loading")}</span>
            </div>
          ) : goalError && !editingGoal ? (
            <div
              className="flex flex-col items-center gap-3 py-4"
              data-ocid="hydration.error_state"
            >
              <p className="text-sm text-muted-foreground">{t("errorGoal")}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchGoal()}
                className="gap-2"
                data-ocid="hydration.secondary_button"
              >
                <RefreshCw size={14} />
                {t("retry")}
              </Button>
            </div>
          ) : showGoalForm ? (
            <div className="p-4 rounded-xl border border-border bg-card">
              <p className="text-sm font-semibold text-foreground mb-1">
                {editingGoal ? t("changeGoal") : t("setGoal")}
              </p>
              {isGoalNotSet && !editingGoal && (
                <p className="text-xs text-muted-foreground mb-3">
                  {t("goalSetPrompt")}
                </p>
              )}
              {editingGoal && (
                <p className="text-xs text-muted-foreground mb-3">
                  {t("goalCurrent").replace("{0}", String(goalMl))}
                </p>
              )}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    placeholder={t("goalPlaceholder")}
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveGoal()}
                    className="pr-10"
                    autoFocus
                    data-ocid="hydration.input"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    ml
                  </span>
                </div>
                <Button
                  onClick={handleSaveGoal}
                  disabled={saveGoalMutation.isPending}
                  data-ocid="hydration.save_button"
                  className="shrink-0"
                >
                  {saveGoalMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    t("goalSet")
                  )}
                </Button>
                {editingGoal && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingGoal(false);
                      setGoalInput("");
                    }}
                    data-ocid="hydration.cancel_button"
                  >
                    {t("cancel")}
                  </Button>
                )}
              </div>
            </div>
          ) : isGoalSet ? (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2">
                <Droplets size={16} className="text-blue-400" />
                <span className="text-sm text-muted-foreground">
                  {t("dailyGoal")}:
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {goalMl} ml
                </span>
              </div>
              <button
                type="button"
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                onClick={() => {
                  setGoalInput(String(goalMl));
                  setEditingGoal(true);
                }}
                aria-label={t("editGoal")}
                data-ocid="hydration.edit_button"
              >
                <Pencil size={14} className="text-muted-foreground" />
              </button>
            </div>
          ) : null}
        </section>

        {isGoalSet && (
          <section className="px-4 pb-4">
            <div className="flex gap-2">
              {[250, 500, 1000].map((ml) => (
                <button
                  key={ml}
                  type="button"
                  className="flex-1 py-3 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors active:scale-95"
                  onClick={() => handleAddWater(ml)}
                  disabled={addWaterMutation.isPending}
                  data-ocid="hydration.secondary_button"
                >
                  +{ml} ml
                </button>
              ))}
            </div>
          </section>
        )}

        {isGoalSet && (
          <section className="px-4 pb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  placeholder={t("manualEntry")}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualAdd()}
                  className="pr-10"
                  data-ocid="hydration.textarea"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  ml
                </span>
              </div>
              <Button
                onClick={handleManualAdd}
                disabled={addWaterMutation.isPending}
                variant="outline"
                data-ocid="hydration.primary_button"
              >
                {t("add")}
              </Button>
            </div>
          </section>
        )}

        <section className="px-4 pb-8">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            {t("history")}
          </h2>
          {pastHistory.length === 0 ? (
            <div
              className="text-center py-8 text-sm text-muted-foreground"
              data-ocid="hydration.empty_state"
            >
              {t("noHistory")}
            </div>
          ) : (
            <div className="space-y-2">
              {pastHistory
                .slice()
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .map((record, i) => (
                  <div
                    key={record.date}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card"
                    data-ocid={`hydration.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-2">
                      <Droplets size={14} className="text-blue-400" />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(record.date)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {Number(record.totalMl)} ml
                    </span>
                  </div>
                ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
