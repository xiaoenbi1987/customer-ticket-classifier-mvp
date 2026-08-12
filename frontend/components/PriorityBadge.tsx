import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { TranslationKey } from "@/lib/i18n/translations";

const PRIORITY_LABEL_KEYS: Record<number, TranslationKey> = {
  1: "priority.low",
  2: "priority.medium",
  3: "priority.high",
  4: "priority.urgent",
};

const PRIORITY_STYLES: Record<number, string> = {
  1: "bg-slate-100 text-slate-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-orange-100 text-orange-700",
  4: "bg-red-100 text-red-700",
};

export default function PriorityBadge({ priority }: { priority: number | null }) {
  const { t } = useLanguage();

  if (priority === null) {
    return (
      <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-500">
        {t("priority.unscored")}
      </span>
    );
  }

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        PRIORITY_STYLES[priority] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {PRIORITY_LABEL_KEYS[priority] ? t(PRIORITY_LABEL_KEYS[priority]) : priority} ({priority})
    </span>
  );
}
