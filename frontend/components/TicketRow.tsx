"use client";

import { useState } from "react";
import type { Ticket, TriggeredRule } from "@/lib/types";
import { useLanguage, type Language } from "@/lib/i18n/LanguageContext";
import type { TranslationKey } from "@/lib/i18n/translations";
import PriorityBadge from "./PriorityBadge";

const DECISION_LABEL_KEYS: Record<Ticket["decision_status"], TranslationKey> = {
  pending: "status.pending",
  confirmed: "status.confirmed",
  adjusted: "status.adjusted",
};

const DECISION_STYLES: Record<Ticket["decision_status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  adjusted: "bg-purple-100 text-purple-700",
};

// 把后端返回的结构化触发规则列表，按当前语言拼成一段完整的理由文字。
// 每条规则的文案模板存在 translations.ts 里，这里只负责选模板 + 填参数 + 拼接。
function formatReason(
  rules: TriggeredRule[] | null,
  language: Language,
  t: (key: TranslationKey) => string,
): string {
  if (!rules || rules.length === 0) return "-";

  const separator = language === "zh" ? "；" : "; ";

  return rules
    .map((rule) => {
      switch (rule.rule) {
        case "keyword_single":
        case "keyword_combo": {
          const groups = (rule.params.groups as string[] | undefined) ?? [];
          const groupLabels = groups
            .map((group) => t(`rule.group.${group}` as TranslationKey))
            .join("+");
          const template = t(
            rule.rule === "keyword_combo" ? "rule.keywordCombo" : "rule.keywordSingle",
          );
          return template.replace("{groups}", groupLabels);
        }
        case "high_tier_customer": {
          const plan = String(rule.params.plan ?? "");
          return t("rule.highTierCustomer").replace("{plan}", plan);
        }
        case "repeat_customer": {
          const count = String(rule.params.count ?? "");
          const days = String(rule.params.days ?? "");
          return t("rule.repeatCustomer")
            .replace("{count}", count)
            .replace("{days}", days);
        }
        case "no_rules_matched":
          return t("rule.noRulesMatched");
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join(separator);
}

export default function TicketRow({
  ticket,
  onConfirm,
  onAdjust,
}: {
  ticket: Ticket;
  onConfirm: (ticketId: string) => Promise<void>;
  onAdjust: (ticketId: string, newPriority: number) => Promise<void>;
}) {
  const { t, language } = useLanguage();
  const [selectedPriority, setSelectedPriority] = useState(
    ticket.final_priority ?? ticket.suggested_priority ?? 1,
  );
  // 记录上一次渲染时这条工单来自服务端的实际优先级/状态。confirm 或 adjust 返回新数据后
  // 这里会对不上，就在渲染阶段把下拉框同步回服务端的真实值——否则下拉框会停留在
  // 组件挂载时的旧 state，出现"下拉框显示 3、优先级徽章显示 2"的界面与数据不一致。
  const [syncedFrom, setSyncedFrom] = useState(
    `${ticket.final_priority}/${ticket.decision_status}`,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSync = `${ticket.final_priority}/${ticket.decision_status}`;
  if (currentSync !== syncedFrom) {
    setSyncedFrom(currentSync);
    setSelectedPriority(ticket.final_priority ?? ticket.suggested_priority ?? 1);
  }

  // "确认"的语义是"认可系统建议"，所以只看下拉框是否停在建议值上，不看 decision_status：
  // 已调整过的工单想改回建议值，同样通过"确认"提交（后端会把 final_priority 写回建议值、
  // 记一条 action="confirm"，语义正好吻合）。用户一旦把下拉框改成别的值，就必须走"调整"——
  // 否则会按建议值提交、并留下一条"原值=新值"的 confirm 记录，污染将来的训练标注。
  const matchesSuggestion = selectedPriority === ticket.suggested_priority;
  const canConfirm = !isSubmitting && matchesSuggestion;
  // "调整"的语义是"人工改掉了系统建议"，所以只有下拉框和建议值不同时才可点，
  // 相同时必须走"确认"。后端写日志时 original_priority 固定取 suggested_priority，
  // 若允许在两值相同时点"调整"，就会留下一条 original == adjusted 的 action="adjust"
  // 记录，和 confirm 语义重叠。这条约束保证 log 里每条 adjust 都对应一次真实的改动。
  const canAdjust = !isSubmitting && !matchesSuggestion;

  // canConfirm 和 canAdjust 是同一个条件的两面，所以只要不在提交中，
  // 任何下拉框取值下都恰好有一个按钮可点，不存在两个都灰的死胡同。
  const confirmHint = matchesSuggestion ? undefined : t("actions.confirmDisabledChanged");
  const adjustHint = matchesSuggestion ? t("actions.adjustDisabledSame") : undefined;
  const rowHint =
    !isSubmitting && !matchesSuggestion ? t("actions.confirmDisabledChanged") : undefined;

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(ticket.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.confirmFailed"));
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
      setError(err instanceof Error ? err.message : t("errors.adjustFailed"));
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
        <div className="font-medium text-slate-900">
          {language === "en" ? ticket.title_en ?? ticket.title : ticket.title}
        </div>
        <div className="mt-0.5 text-xs text-slate-500 line-clamp-2">
          {language === "en" ? ticket.content_en ?? ticket.content : ticket.content}
        </div>
      </td>
      <td className="py-3 pr-4 whitespace-nowrap">
        <div className="text-slate-900">{ticket.customer_name}</div>
        <div className="text-xs text-slate-500">{ticket.customer_plan}</div>
      </td>
      <td className="py-3 pr-4 max-w-sm text-xs text-slate-600">
        {formatReason(ticket.suggested_reason, language, t)}
      </td>
      <td className="py-3 pr-4 whitespace-nowrap">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${DECISION_STYLES[ticket.decision_status]}`}
        >
          {t(DECISION_LABEL_KEYS[ticket.decision_status])}
        </span>
      </td>
      <td className="py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            title={confirmHint}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("actions.confirm")}
          </button>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(Number(e.target.value))}
            disabled={isSubmitting}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-xs"
          >
            <option value={1}>{t("priority.low")} (1)</option>
            <option value={2}>{t("priority.medium")} (2)</option>
            <option value={3}>{t("priority.high")} (3)</option>
            <option value={4}>{t("priority.urgent")} (4)</option>
          </select>
          <button
            type="button"
            onClick={handleAdjust}
            disabled={!canAdjust}
            title={adjustHint}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("actions.adjust")}
          </button>
        </div>
        {rowHint && <div className="mt-1 text-xs text-slate-500">{rowHint}</div>}
        {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
      </td>
    </tr>
  );
}
