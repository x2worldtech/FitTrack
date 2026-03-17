import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CheckSquare,
  Dumbbell,
  Loader2,
  Minus,
  Moon,
  Pill,
  Plus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { DayEntry } from "../backend.d.ts";
import { useLanguage } from "../context/LanguageContext";

interface ExtendedDayEntry extends DayEntry {
  creatineGrams?: bigint;
  proteinGrams?: bigint;
}

interface DaySheetProps {
  date: string | null;
  entry: ExtendedDayEntry | null;
  onClose: () => void;
  onSave: (params: {
    date: string;
    trained: boolean;
    restDay: boolean;
    muscleGroups: string[];
    creatine: boolean;
    protein: boolean;
    creatineGrams: number;
    proteinGrams: number;
  }) => Promise<void>;
  isSaving: boolean;
}

function formatDateHeader(dateStr: string, lang: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(lang === "de" ? "de-DE" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function GramInput({
  value,
  onChange,
  min,
  max,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mt-2 ml-1">
      <span className="text-xs text-muted-foreground min-w-[60px]">
        {label}
      </span>
      <div className="flex items-center gap-1 bg-background rounded-lg border border-border overflow-hidden">
        <button
          type="button"
          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label="Less"
        >
          <Minus size={12} />
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const v = Number.parseInt(e.target.value, 10);
            if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
          className="w-10 text-center text-sm font-semibold bg-transparent text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-muted-foreground pr-1">g</span>
        <button
          type="button"
          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label="More"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

export default function DaySheet({
  date,
  entry,
  onClose,
  onSave,
  isSaving,
}: DaySheetProps) {
  const { t, language } = useLanguage();
  const muscleGroupOptions: string[] = t("muscleGroupOptions");

  const [trained, setTrained] = useState(false);
  const [restDay, setRestDay] = useState(false);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [creatine, setCreatine] = useState(false);
  const [protein, setProtein] = useState(false);
  const [creatineGrams, setCreatineGrams] = useState(5);
  const [proteinGrams, setProteinGrams] = useState(30);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (entry) {
      setTrained(entry.trained);
      setRestDay(entry.restDay ?? false);
      setMuscleGroups(entry.muscleGroups);
      setCreatine(entry.creatine);
      setProtein(entry.protein);
      setCreatineGrams(entry.creatineGrams ? Number(entry.creatineGrams) : 5);
      setProteinGrams(entry.proteinGrams ? Number(entry.proteinGrams) : 30);
    } else {
      setTrained(false);
      setRestDay(false);
      setMuscleGroups([]);
      setCreatine(false);
      setProtein(false);
      setCreatineGrams(5);
      setProteinGrams(30);
    }
    setIsClosing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  const handleTrainedChange = (val: boolean) => {
    setTrained(val);
    if (val) setRestDay(false);
  };

  const handleRestDayChange = (val: boolean) => {
    setRestDay(val);
    if (val) setTrained(false);
  };

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 220);
  }, [onClose]);

  const handleBackdropKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") handleClose();
    },
    [handleClose],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  const toggleMuscle = (muscle: string) => {
    setMuscleGroups((prev) =>
      prev.includes(muscle)
        ? prev.filter((m) => m !== muscle)
        : [...prev, muscle],
    );
  };

  const handleSave = async () => {
    if (!date) return;
    await onSave({
      date,
      trained,
      restDay,
      muscleGroups,
      creatine,
      protein,
      creatineGrams,
      proteinGrams,
    });
    handleClose();
  };

  if (!date) return null;

  return (
    <div
      className="sheet-backdrop"
      onClick={handleClose}
      onKeyDown={handleBackdropKeyDown}
      aria-hidden="true"
    >
      <div
        aria-modal="true"
        aria-label={t("dayEntry")}
        data-ocid="day_sheet.dialog"
        className={`absolute bottom-0 left-0 right-0 max-w-[430px] mx-auto rounded-t-2xl overflow-hidden ${
          isClosing ? "sheet-slide-down" : "sheet-slide-up"
        }`}
        style={{ background: "oklch(var(--card))" }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-display mb-0.5">
              {t("dayEntry")}
            </p>
            <h2 className="text-base font-semibold text-foreground font-display leading-tight">
              {formatDateHeader(date, language)}
            </h2>
          </div>
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors press-scale"
            onClick={handleClose}
            aria-label={t("close")}
            data-ocid="day_sheet.close_button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className="overflow-y-auto overscroll-contain px-5 py-5 space-y-4"
          style={{ maxHeight: "70dvh" }}
        >
          {/* Trained Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: trained ? "#1a6b3a" : undefined }}
              >
                <Dumbbell
                  size={18}
                  style={{ color: trained ? "#ffffff" : undefined }}
                  className={!trained ? "text-muted-foreground" : ""}
                />
              </div>
              <div>
                <Label
                  htmlFor="trained-switch"
                  className="text-sm font-semibold text-foreground cursor-pointer"
                >
                  {t("trainedToday")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {trained ? t("trainedYes") : t("trainedNo")}
                </p>
              </div>
            </div>
            <Switch
              id="trained-switch"
              checked={trained}
              onCheckedChange={handleTrainedChange}
              data-ocid="day_sheet.trained_toggle"
            />
          </div>

          {/* Rest Day Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: restDay ? "#1a3a6b" : undefined }}
              >
                <Moon
                  size={18}
                  style={{ color: restDay ? "#ffffff" : undefined }}
                  className={!restDay ? "text-muted-foreground" : ""}
                />
              </div>
              <div>
                <Label
                  htmlFor="restday-switch"
                  className="text-sm font-semibold text-foreground cursor-pointer"
                >
                  {t("restDay")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {restDay ? t("restDayYes") : t("restDayNo")}
                </p>
              </div>
            </div>
            <Switch
              id="restday-switch"
              checked={restDay}
              onCheckedChange={handleRestDayChange}
              data-ocid="day_sheet.restday_toggle"
            />
          </div>

          {/* Muscle Groups - only when trained */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              trained ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0"
            }`}
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-display mb-3">
              {t("muscleGroups")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {muscleGroupOptions.map((muscle: string, i: number) => {
                const checked = muscleGroups.includes(muscle);
                return (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => toggleMuscle(muscle)}
                    data-ocid={`day_sheet.muscle.checkbox.${i + 1}`}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 press-scale text-left ${
                      checked
                        ? "border-trained bg-trained/20 text-foreground"
                        : "border-border bg-accent/50 text-muted-foreground"
                    }`}
                    aria-pressed={checked}
                    aria-label={muscle}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        checked
                          ? "border-trained bg-trained"
                          : "border-border bg-transparent"
                      }`}
                    >
                      {checked && (
                        <CheckSquare
                          size={12}
                          className="text-trained-foreground"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium leading-tight">
                      {muscle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Supplements */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Pill size={13} className="text-muted-foreground" />
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-display">
                {t("supplements")}
              </p>
            </div>
            <div className="space-y-2">
              {/* Creatine */}
              <div
                className={`rounded-xl border transition-all duration-200 ${
                  creatine
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-accent/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setCreatine((v) => !v)}
                  data-ocid="day_sheet.creatine_checkbox"
                  className="w-full flex items-center gap-3 p-3.5 press-scale text-left"
                  aria-pressed={creatine}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      creatine ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {creatine && (
                      <CheckSquare
                        size={12}
                        className="text-primary-foreground"
                      />
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-sm font-semibold block leading-tight ${
                        creatine ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {t("creatineTaken")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("creatineDailyDose")}
                    </span>
                  </div>
                </button>
                {creatine && (
                  <div className="px-3.5 pb-3">
                    <GramInput
                      value={creatineGrams}
                      onChange={setCreatineGrams}
                      min={1}
                      max={50}
                      label={t("amount")}
                    />
                  </div>
                )}
              </div>

              {/* Protein */}
              <div
                className={`rounded-xl border transition-all duration-200 ${
                  protein
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-accent/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setProtein((v) => !v)}
                  data-ocid="day_sheet.protein_checkbox"
                  className="w-full flex items-center gap-3 p-3.5 press-scale text-left"
                  aria-pressed={protein}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      protein ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {protein && (
                      <CheckSquare
                        size={12}
                        className="text-primary-foreground"
                      />
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-sm font-semibold block leading-tight ${
                        protein ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {t("proteinTaken")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("proteinMeal")}
                    </span>
                  </div>
                </button>
                {protein && (
                  <div className="px-3.5 pb-3">
                    <GramInput
                      value={proteinGrams}
                      onChange={setProteinGrams}
                      min={1}
                      max={200}
                      label={t("amount")}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="px-5 pb-6 pt-3 border-t border-border">
          <Button
            className="w-full h-12 text-sm font-semibold font-display rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all press-scale"
            onClick={handleSave}
            disabled={isSaving}
            data-ocid="day_sheet.save_button"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              t("save")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
