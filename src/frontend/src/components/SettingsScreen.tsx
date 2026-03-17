import { Check, ChevronLeft, Settings } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import type { Language } from "../i18n/translations";

interface SettingsScreenProps {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { t, language, setLanguage } = useLanguage();

  const langs: { code: Language; label: string }[] = [
    { code: "en", label: t("english") },
    { code: "de", label: t("german") },
  ];

  return (
    <div className="min-h-dvh bg-background flex flex-col max-w-[430px] mx-auto">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          onClick={onBack}
          aria-label={t("back")}
          data-ocid="settings.close_button"
        >
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-muted-foreground" />
          <h1 className="text-base font-bold font-display text-foreground">
            {t("settingsTitle")}
          </h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t("language")}
          </p>
          <div className="space-y-2">
            {langs.map(({ code, label }) => {
              const isActive = language === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLanguage(code)}
                  data-ocid={`settings.lang_${code}.toggle`}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border transition-all press-scale ${
                    isActive
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="text-sm font-semibold">{label}</span>
                  {isActive && <Check size={16} strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
