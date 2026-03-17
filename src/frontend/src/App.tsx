import { Toaster } from "@/components/ui/sonner";
import {
  Activity,
  BarChart2,
  ChevronRight,
  Droplets,
  Dumbbell,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { DayEntry } from "./backend.d.ts";
import Calendar from "./components/Calendar";
import DaySheet from "./components/DaySheet";
import HydrationScreen from "./components/HydrationScreen";
import SettingsScreen from "./components/SettingsScreen";
import StatisticsScreen from "./components/StatisticsScreen";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetAllEntries, useSaveDayEntry } from "./hooks/useQueries";

type AppView = "calendar" | "hydration" | "statistics" | "settings";

interface ExtendedDayEntry extends DayEntry {
  creatineGrams?: bigint;
  proteinGrams?: bigint;
}

// ─── Login Screen ─────────────────────────────────────────────────────────
function LoginScreen() {
  const { login, isLoggingIn } = useInternetIdentity();
  const { t } = useLanguage();

  const features = [
    { icon: <Activity size={16} strokeWidth={2} />, label: t("loginFeature1") },
    {
      icon: <TrendingUp size={16} strokeWidth={2} />,
      label: t("loginFeature2"),
    },
    {
      icon: <ShieldCheck size={16} strokeWidth={2} />,
      label: t("loginFeature3"),
    },
  ];

  return (
    <div className="login-bg min-h-dvh flex flex-col items-center justify-center px-6 fade-in">
      {/* Animated background layers */}
      <div className="login-glow-top" aria-hidden="true" />
      <div className="login-orb-1" aria-hidden="true" />
      <div className="login-orb-2" aria-hidden="true" />
      <div className="login-orb-3" aria-hidden="true" />
      <div className="login-noise" aria-hidden="true" />

      {/* Content — sits above background layers via relative positioning */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="flex flex-col items-center mb-12">
          <div className="relative mb-8">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow:
                  "0 0 0 1px oklch(0.30 0 0), 0 0 40px 4px oklch(0.20 0 0)",
              }}
            />
            <div
              className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(145deg, oklch(0.22 0 0) 0%, oklch(0.12 0 0) 100%)",
                boxShadow:
                  "inset 0 1px 0 oklch(0.32 0 0), inset 0 -1px 0 oklch(0.08 0 0), 0 8px 32px oklch(0.04 0 0)",
              }}
            >
              <Dumbbell
                size={38}
                className="text-foreground"
                strokeWidth={1.5}
              />
            </div>
          </div>

          <h1
            className="text-5xl font-bold tracking-tighter leading-none mb-3"
            style={{
              fontFamily: "'General Sans', system-ui, sans-serif",
              background:
                "linear-gradient(180deg, oklch(0.98 0 0) 0%, oklch(0.72 0 0) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {t("loginTitle")}
          </h1>
          <p className="text-sm tracking-widest uppercase text-muted-foreground font-medium">
            {t("loginSubtitle")}
          </p>
        </div>

        <div className="w-full max-w-[360px] space-y-5 mb-12">
          {features.map((f) => (
            <div key={f.label} className="flex items-center gap-4">
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground"
                style={{
                  background: "oklch(0.16 0 0)",
                  boxShadow: "inset 0 1px 0 oklch(0.24 0 0)",
                }}
              >
                {f.icon}
              </div>
              <span className="text-sm text-muted-foreground leading-snug">
                {f.label}
              </span>
            </div>
          ))}
        </div>

        <div className="w-full max-w-[360px]">
          <button
            type="button"
            className="login-btn w-full flex items-center justify-between px-6 py-4 rounded-2xl font-semibold text-sm press-scale disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={login}
            disabled={isLoggingIn}
            data-ocid="login.primary_button"
            style={{ background: "oklch(0.96 0 0)", color: "oklch(0.08 0 0)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "oklch(0.14 0 0)" }}
              >
                <User size={14} style={{ color: "oklch(0.75 0 0)" }} />
              </div>
              <span className="tracking-tight">
                {isLoggingIn ? t("loginLoading") : t("loginButton")}
              </span>
            </div>
            {!isLoggingIn && (
              <ChevronRight size={16} style={{ color: "oklch(0.45 0 0)" }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Burger Menu ─────────────────────────────────────────────────────────
interface BurgerMenuProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
}

function BurgerMenu({ open, onClose, onNavigate }: BurgerMenuProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  return (
    <>
      <div
        ref={overlayRef}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 max-w-[80vw] bg-background border-r border-border flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        data-ocid="nav.panel"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell size={14} className="text-primary-foreground" />
            </div>
            <span className="font-bold font-display text-foreground">
              FitTrack
            </span>
          </div>
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
            onClick={onClose}
            aria-label={t("close")}
            data-ocid="nav.close_button"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Tracking
          </p>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors text-left"
            onClick={() => {
              onNavigate("hydration");
              onClose();
            }}
            data-ocid="nav.hydration_link"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Droplets size={16} className="text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {t("hydration")}
            </p>
          </button>

          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors text-left"
            onClick={() => {
              onNavigate("statistics");
              onClose();
            }}
            data-ocid="nav.statistics_link"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <BarChart2 size={16} className="text-purple-400" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {t("statistics")}
            </p>
          </button>

          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors text-left"
            onClick={() => {
              onNavigate("settings");
              onClose();
            }}
            data-ocid="nav.settings_link"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Settings size={16} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {t("settings")}
            </p>
          </button>
        </nav>

        <div className="px-4 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground/50 text-center">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────────
function MainApp() {
  const { clear, identity } = useInternetIdentity();
  const { data: rawEntries, isLoading } = useGetAllEntries();
  const saveMutation = useSaveDayEntry();
  const { t } = useLanguage();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>("calendar");
  const [menuOpen, setMenuOpen] = useState(false);

  const entriesMap = useMemo<Record<string, ExtendedDayEntry>>(() => {
    if (!rawEntries) return {};
    return rawEntries.reduce<Record<string, ExtendedDayEntry>>((acc, entry) => {
      acc[entry.date] = entry as ExtendedDayEntry;
      return acc;
    }, {});
  }, [rawEntries]);

  const selectedEntry = selectedDate
    ? (entriesMap[selectedDate] ?? null)
    : null;

  const handleDayPress = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedDate(null);
  }, []);

  const handleSave = useCallback(
    async (params: {
      date: string;
      trained: boolean;
      restDay: boolean;
      muscleGroups: string[];
      creatine: boolean;
      protein: boolean;
      creatineGrams: number;
      proteinGrams: number;
    }) => {
      try {
        await saveMutation.mutateAsync(params);
        const desc = params.trained
          ? t("saveSuccessTrained")
          : params.restDay
            ? t("saveSuccessRest")
            : t("saveSuccessNone");
        toast.success(t("saveSuccess"), { description: desc });
      } catch {
        toast.error(t("saveFailed"), { description: t("saveFailedDesc") });
        throw new Error("save failed");
      }
    },
    [saveMutation, t],
  );

  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}\u2026${principal.slice(-4)}`
    : "";

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const trainedThisMonth = useMemo(() => {
    const prefix = todayKey.slice(0, 7);
    return Object.values(entriesMap).filter(
      (e) => e.date.startsWith(prefix) && e.trained,
    ).length;
  }, [entriesMap, todayKey]);

  const toastOptions = {
    style: {
      background: "oklch(0.20 0 0)",
      border: "1px solid oklch(0.28 0 0)",
      color: "oklch(0.96 0 0)",
    },
  };

  if (currentView === "hydration") {
    return (
      <>
        <HydrationScreen onBack={() => setCurrentView("calendar")} />
        <Toaster position="top-center" toastOptions={toastOptions} />
      </>
    );
  }

  if (currentView === "statistics") {
    return (
      <>
        <StatisticsScreen onBack={() => setCurrentView("calendar")} />
        <Toaster position="top-center" toastOptions={toastOptions} />
      </>
    );
  }

  if (currentView === "settings") {
    return (
      <>
        <SettingsScreen onBack={() => setCurrentView("calendar")} />
        <Toaster position="top-center" toastOptions={toastOptions} />
      </>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col max-w-[430px] mx-auto">
      <BurgerMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(view) => setCurrentView(view)}
      />

      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors press-scale"
            onClick={() => setMenuOpen(true)}
            aria-label={t("menu")}
            data-ocid="nav.open_modal_button"
          >
            <Menu size={18} className="text-foreground" />
          </button>
          <div>
            <h1 className="text-base font-bold font-display text-foreground leading-none">
              FitTrack
            </h1>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">
              {shortPrincipal}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
            <div className="w-2 h-2 rounded-full bg-trained" />
            <span className="text-xs font-semibold text-foreground">
              {trainedThisMonth}×
            </span>
            <span className="text-xs text-muted-foreground">
              {t("thisMonthLabel")}
            </span>
          </div>

          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors press-scale"
            onClick={clear}
            aria-label={t("logout")}
            data-ocid="nav.toggle"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-safe-area-inset-bottom">
        <Calendar
          entries={entriesMap}
          onDayPress={handleDayPress}
          isLoading={isLoading}
        />

        <footer className="text-center py-6 px-4">
          <p className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground transition-colors"
            >
              Built with ♥ using caffeine.ai
            </a>
          </p>
        </footer>
      </main>

      {selectedDate && (
        <DaySheet
          date={selectedDate}
          entry={selectedEntry}
          onClose={handleClose}
          onSave={handleSave}
          isSaving={saveMutation.isPending}
        />
      )}

      <Toaster position="top-center" toastOptions={toastOptions} />
    </div>
  );
}

function AppWithLanguage() {
  const { loginStatus, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 fade-in">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Dumbbell size={22} className="text-primary-foreground" />
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loginStatus !== "success") {
    return <LoginScreen />;
  }

  return <MainApp />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AppWithLanguage />
    </LanguageProvider>
  );
}
