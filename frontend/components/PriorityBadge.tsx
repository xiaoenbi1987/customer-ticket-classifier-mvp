const PRIORITY_LABELS: Record<number, string> = {
  1: "低",
  2: "中",
  3: "高",
  4: "紧急",
};

const PRIORITY_STYLES: Record<number, string> = {
  1: "bg-slate-100 text-slate-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-orange-100 text-orange-700",
  4: "bg-red-100 text-red-700",
};

export default function PriorityBadge({ priority }: { priority: number | null }) {
  if (priority === null) {
    return (
      <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-500">
        未评分
      </span>
    );
  }

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        PRIORITY_STYLES[priority] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {PRIORITY_LABELS[priority] ?? priority} ({priority})
    </span>
  );
}
