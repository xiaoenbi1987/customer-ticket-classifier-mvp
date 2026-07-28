// 与后端 backend/app/models/schemas.py 中的 Pydantic 模型一一对应

export type CustomerPlan = "free" | "basic" | "pro" | "enterprise";

export type DecisionStatus = "pending" | "confirmed" | "adjusted";

export interface Ticket {
  id: string;
  title: string;
  content: string;

  customer_id: string;
  customer_name: string;
  customer_plan: CustomerPlan;

  created_at: string;
  resolved_at: string | null;

  decision_status: DecisionStatus;

  suggested_priority: number | null;
  suggested_reason: string | null;
  final_priority: number | null;
}

export interface Stats {
  total: number;
  processed: number;
  pending: number;
  avg_handling_time_hours: number | null;
}
