"use client";

import { useState } from "react";
import type { Ticket } from "@/lib/types";
import PriorityBadge from "./PriorityBadge";

const DECISION_LABELS: Record<Ticket["decision_status"], string> = {
  pending: "待决策",
  confirmed: "已确认",
  adjusted: "已调整",
};

const DECISION_STYLES: Record<Ticket["decision_status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  adjusted: "bg-purple-100 text-purple-700",
};

export default function TicketRow({
  ticket,
  onConfirm,
  onAdjust,
}: {
  ticket: Ticket;
  onConfirm: (ticketId: string) => Promise<void>;
  onAdjust: (ticketId: string, newPriority: number) => Promise<void>;
}) {
  const [selectedPriority, setSelectedPriority] = useState(
    ticket.final_priority ?? ticket.suggested_priority ?? 1,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDecided = ticket.decision_status !== "pending";

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(ticket.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "确认失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAdjust() {
    setIsSubmitting(true);
    setError(null);
    try {
      await onAdjust(ticket.id, selectedPriority);
    } catch (err) {
      setError(err instanceof Error ? err.message : "调整失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <tr className="border-b border-slate-100 align-top">
      <td className="py-3 pl-4 pr-4">
        <PriorityBadge priority={ticket.final_priority} />
      </td>
      <td className="py-3 pr-4 max-w-xs">
        <div className="font-medium text-slate-900">{ticket.title}</div>
        <div className="mt-0.5 text-xs text-slate-500 line-clamp-2">
          {ticket.content}
        </div>
      </td>
      <td className="py-3 pr-4 whitespace-nowrap">
        <div className="text-slate-900">{ticket.customer_name}</div>
        <div className="text-xs text-slate-500">{ticket.customer_plan}</div>
      </td>
      <td className="py-3 pr-4 max-w-sm text-xs text-slate-600">
        {ticket.suggested_reason ?? "-"}
      </td>
      <td className="py-3 pr-4 whitespace-nowrap">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${DECISION_STYLES[ticket.decision_status]}`}
        >
          {DECISION_LABELS[ticket.decision_status]}
        </span>
      </td>
      <td className="py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || isDecided}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
            确认
          </button>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(Number(e.target.value))}
            disabled={isSubmitting}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-xs"
          >
            <option value={1}>低 (1)</option>
            <option value={2}>中 (2)</option>
            <option value={3}>高 (3)</option>
            <option value={4}>紧急 (4)</option>
          </select>
          <button
            type="button"
            onClick={handleAdjust}
            disabled={isSubmitting}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40"
          >
            调整
          </button>
        </div>
        {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
      </td>
    </tr>
  );
}
