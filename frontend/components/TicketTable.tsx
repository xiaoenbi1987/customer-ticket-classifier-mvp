import type { Ticket } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import TicketRow from "./TicketRow";

export default function TicketTable({
  tickets,
  onConfirm,
  onAdjust,
}: {
  tickets: Ticket[];
  onConfirm: (ticketId: string) => Promise<void>;
  onAdjust: (ticketId: string, newPriority: number) => Promise<void>;
}) {
  const { t } = useLanguage();

  if (tickets.length === 0) {
    return <p className="text-sm text-slate-500">{t("table.empty")}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="py-2 pl-4 pr-4 font-medium">{t("table.priority")}</th>
            <th className="py-2 pr-4 font-medium">{t("table.content")}</th>
            <th className="py-2 pr-4 font-medium">{t("table.customer")}</th>
            <th className="py-2 pr-4 font-medium">{t("table.reason")}</th>
            <th className="py-2 pr-4 font-medium">{t("table.decisionStatus")}</th>
            <th className="py-2 font-medium">{t("table.actions")}</th>
          </tr>
        </thead>
        <tbody className="px-4">
          {tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              onConfirm={onConfirm}
              onAdjust={onAdjust}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
