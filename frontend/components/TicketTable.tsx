import type { Ticket } from "@/lib/types";
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
  if (tickets.length === 0) {
    return <p className="text-sm text-slate-500">暂无工单数据</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="py-2 pl-4 pr-4 font-medium">优先级</th>
            <th className="py-2 pr-4 font-medium">工单内容</th>
            <th className="py-2 pr-4 font-medium">客户</th>
            <th className="py-2 pr-4 font-medium">评分理由</th>
            <th className="py-2 pr-4 font-medium">决策状态</th>
            <th className="py-2 font-medium">操作</th>
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
