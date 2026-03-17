import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DayEntry } from "../backend.d.ts";
import { useLanguage } from "../context/LanguageContext";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

type EntryMap = Record<string, DayEntry>;

interface CalendarProps {
  entries: EntryMap;
  onDayPress: (date: string) => void;
  isLoading?: boolean;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isToday(year: number, month: number, day: number): boolean {
  const t = new Date();
  return (
    t.getFullYear() === year && t.getMonth() === month && t.getDate() === day
  );
}

function isPast(year: number, month: number, day: number): boolean {
  const t = new Date();
  const now = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return new Date(year, month, day) < now;
}

type Cell = { type: "empty"; key: string } | { type: "day"; day: number };

function buildCells(year: number, month: number): Cell[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Cell[] = [];
  for (let i = 0; i < firstDow; i++) {
    cells.push({ type: "empty", key: `pre-${month}-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ type: "day", day: d });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ type: "empty", key: `post-${month}-${cells.length}` });
  }
  return cells;
}

interface MonthGridProps {
  year: number;
  month: number;
  entries: EntryMap;
  onDayPress: (date: string) => void;
  todayRef?: React.RefObject<HTMLButtonElement | null>;
  monthName: string;
  weekdays: string[];
}

function getDayBg(entry: DayEntry | undefined, past: boolean): string {
  if (entry?.trained) return "#1a6b3a";
  if (entry?.restDay) return "#1a3a6b";
  if (past) return "#6b1a1a";
  return "#2c2c2e";
}

function MonthGrid({
  year,
  month,
  entries,
  onDayPress,
  todayRef,
  monthName,
  weekdays,
}: MonthGridProps) {
  const cells = buildCells(year, month);

  return (
    <div
      className="rounded-2xl mb-4 overflow-hidden"
      style={{ background: "#1c1c1e" }}
    >
      <div className="pt-4 pb-2 text-center">
        <span className="text-base font-semibold text-white">{monthName}</span>
      </div>

      <div className="grid grid-cols-7 px-2 pb-1">
        {weekdays.map((d, i) => (
          <div
            key={WEEKDAY_KEYS[i]}
            className="text-center text-xs font-medium py-1"
            style={{ color: "#8e8e93" }}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 px-2 pb-3">
        {cells.map((cell) => {
          if (cell.type === "empty") {
            return <div key={cell.key} className="aspect-square" />;
          }

          const { day } = cell;
          const dateStr = toDateStr(year, month, day);
          const entry = entries[dateStr];
          const todayDay = isToday(year, month, day);
          const past = isPast(year, month, day);
          const bg = getDayBg(entry, past);

          return (
            <button
              key={day}
              type="button"
              ref={todayDay ? todayRef : undefined}
              onClick={() => onDayPress(dateStr)}
              className="aspect-square rounded-xl flex flex-col items-center justify-center transition-opacity active:opacity-70 select-none focus-visible:outline-none"
              style={{
                background: bg,
                boxShadow: todayDay ? "0 0 0 2px #ffffff80" : undefined,
              }}
              data-ocid={`calendar.day.item.${day}`}
              aria-label={`${day}. ${monthName} ${year}`}
            >
              <span
                className="text-sm font-semibold leading-none"
                style={{ color: "#ffffff" }}
              >
                {day}
              </span>
              {entry && (
                <div className="flex gap-0.5 mt-0.5">
                  {entry.creatine && (
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ background: "#ffffff80" }}
                    />
                  )}
                  {entry.protein && (
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ background: "#ffffff50" }}
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Calendar({
  entries,
  onDayPress,
  isLoading,
}: CalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const todayRef = useRef<HTMLButtonElement | null>(null);
  const { t } = useLanguage();

  const months: string[] = t("months");
  const weekdays: string[] = t("weekdays");

  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="px-4 pt-4 space-y-4" data-ocid="calendar.loading_state">
        {["jan", "feb", "mar"].map((m) => (
          <div
            key={m}
            className="rounded-2xl animate-pulse"
            style={{ background: "#1c1c1e", height: 220 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="select-none">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={() => setViewYear((y) => y - 1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-opacity active:opacity-60"
          style={{ background: "#2c2c2e" }}
          aria-label="Previous year"
          data-ocid="calendar.pagination_prev"
        >
          <ChevronLeft size={20} color="#ffffff" />
        </button>

        <span
          className="text-2xl font-bold text-white"
          data-ocid="calendar.year_label"
        >
          {viewYear}
        </span>

        <button
          type="button"
          onClick={() => setViewYear((y) => y + 1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-opacity active:opacity-60"
          style={{ background: "#2c2c2e" }}
          aria-label="Next year"
          data-ocid="calendar.pagination_next"
        >
          <ChevronRight size={20} color="#ffffff" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pb-3">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: "#1a6b3a" }}
          />
          <span className="text-xs" style={{ color: "#8e8e93" }}>
            {t("legendTrained")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: "#6b1a1a" }}
          />
          <span className="text-xs" style={{ color: "#8e8e93" }}>
            {t("legendNoTraining")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ background: "#1a3a6b" }}
          />
          <span className="text-xs" style={{ color: "#8e8e93" }}>
            {t("legendRestDay")}
          </span>
        </div>
      </div>

      <div className="px-4 pb-6">
        {months.map((name: string, m: number) => (
          <MonthGrid
            key={name}
            year={viewYear}
            month={m}
            entries={entries}
            onDayPress={onDayPress}
            monthName={name}
            weekdays={weekdays}
            todayRef={
              viewYear === today.getFullYear() && m === today.getMonth()
                ? todayRef
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
