// 与后端 backend/app/models/schemas.py 中的 Pydantic 模型一一对应

export type CustomerPlan = "free" | "basic" | "pro" | "enterprise";

export type DecisionStatus = "pending" | "confirmed" | "adjusted";

// 评分理由不再是拼好的中文句子，而是结构化的触发规则列表——
// rule 是规则的稳定标识符，params 是渲染文案模板需要的参数，
// 具体 zh/en 文案模板见 lib/i18n/translations.ts。
export interface TriggeredRule {
  rule: string;
  params: Record<string, unknown>;
}

export interface Ticket {
  id: string;
  title: string;
  content: string;

  // 仅用于 MVP 演示阶段的模拟数据双语字段，真实数据可能没有，展示时要 fallback 到中文字段
  title_en: string | null;
  content_en: string | null;

  customer_id: string;
  customer_name: string;
  customer_plan: CustomerPlan;

  created_at: string;
  resolved_at: string | null;

  decision_status: DecisionStatus;

  suggested_priority: number | null;
  suggested_reason: TriggeredRule[] | null;
  final_priority: number | null;
}

export interface Stats {
  total: number;
  processed: number;
  pending: number;
  avg_handling_time_hours: number | null;
}
