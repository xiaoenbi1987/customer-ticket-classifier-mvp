import type { Stats } from "@/lib/types";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function StatsBar({ stats }: { stats: Stats }) {
  return (
    <div className="flex flex-wrap gap-3">
      <StatCard label="工单总数" value={String(stats.total)} />
      <StatCard label="已处理" value={String(stats.processed)} />
      <StatCard label="待处理" value={String(stats.pending)} />
      <StatCard
        label="平均处理时长"
        value={
          stats.avg_handling_time_hours !== null
            ? `${stats.avg_handling_time_hours} 小时`
            : "暂无数据"
        }
      />
    </div>
  );
}
