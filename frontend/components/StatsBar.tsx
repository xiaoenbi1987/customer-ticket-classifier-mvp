import type { Stats } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function StatsBar({ stats }: { stats: Stats }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap gap-3">
      <StatCard label={t("stats.total")} value={String(stats.total)} />
      <StatCard label={t("stats.processed")} value={String(stats.processed)} />
      <StatCard label={t("stats.pending")} value={String(stats.pending)} />
      <StatCard
        label={t("stats.avgHandlingTime")}
        value={
          stats.avg_handling_time_hours !== null
            ? `${stats.avg_handling_time_hours} ${t("stats.hoursUnit")}`
            : t("common.noData")
        }
      />
    </div>
  );
}
