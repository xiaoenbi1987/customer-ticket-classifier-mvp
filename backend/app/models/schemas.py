"""
所有跨模块共享的数据结构。

设计原则：这里的 Ticket 字段是 mock_source.py 和未来 real_source.py
共同遵守的“契约”——不管工单数据来自哪里，进入系统后都必须长这个样子。
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class CustomerPlan(str, Enum):
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class DecisionStatus(str, Enum):
    """人工是否已经对建议优先级做出决定（与工单本身是否处理完毕是两回事）"""

    PENDING = "pending"
    CONFIRMED = "confirmed"
    ADJUSTED = "adjusted"


class TriggeredRule(BaseModel):
    """
    评分规则命中的一条记录。rule 是规则的稳定标识符（不含具体语言），
    params 是渲染文案模板时需要的参数（比如命中的关键词分组、客户套餐、次数等）。
    前端 translations.ts 里为每个 rule 配置 zh/en 文案模板，用 params 填充。
    """

    rule: str
    params: Dict[str, Any] = Field(default_factory=dict)


class Ticket(BaseModel):
    id: str
    title: str
    content: str

    # 仅用于 MVP 演示阶段的模拟数据双语字段，见 mock_source.py 顶部说明。
    # 真实数据源没有这两个字段也完全没问题（默认 None，前端会自动 fallback 到中文字段）。
    title_en: Optional[str] = None
    content_en: Optional[str] = None

    customer_id: str
    customer_name: str
    customer_plan: CustomerPlan

    created_at: datetime
    resolved_at: Optional[datetime] = None  # 非空代表工单已彻底处理完，用于统计平均处理时间

    decision_status: DecisionStatus = DecisionStatus.PENDING

    # 以下三个字段由 scorer.py 在读取时填充，数据源本身不负责打分
    suggested_priority: Optional[int] = None
    suggested_reason: Optional[List[TriggeredRule]] = None
    final_priority: Optional[int] = None  # 人工确认/调整后的最终优先级，默认等于建议值


class PriorityResult(BaseModel):
    """scorer.score() 的统一输出格式，未来换成 sklearn 模型也要返回这个结构"""

    priority: int = Field(ge=1, le=4)
    reason: List[TriggeredRule]


class AdjustRequest(BaseModel):
    new_priority: int = Field(ge=1, le=4)


class AdjustmentLog(BaseModel):
    id: Optional[int] = None
    ticket_id: str
    original_priority: int
    adjusted_priority: int
    action: str  # "confirm" | "adjust"
    adjusted_at: datetime


class StatsResponse(BaseModel):
    total: int
    processed: int
    pending: int
    avg_handling_time_hours: Optional[float] = None
