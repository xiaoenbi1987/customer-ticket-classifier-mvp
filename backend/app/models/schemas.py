"""
所有跨模块共享的数据结构。

设计原则：这里的 Ticket 字段是 mock_source.py 和未来 real_source.py
共同遵守的“契约”——不管工单数据来自哪里，进入系统后都必须长这个样子。
"""

from datetime import datetime
from enum import Enum
from typing import Optional

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


class Ticket(BaseModel):
    id: str
    title: str
    content: str

    customer_id: str
    customer_name: str
    customer_plan: CustomerPlan

    created_at: datetime
    resolved_at: Optional[datetime] = None  # 非空代表工单已彻底处理完，用于统计平均处理时间

    decision_status: DecisionStatus = DecisionStatus.PENDING

    # 以下三个字段由 scorer.py 在读取时填充，数据源本身不负责打分
    suggested_priority: Optional[int] = None
    suggested_reason: Optional[str] = None
    final_priority: Optional[int] = None  # 人工确认/调整后的最终优先级，默认等于建议值


class PriorityResult(BaseModel):
    """scorer.score() 的统一输出格式，未来换成 sklearn 模型也要返回这个结构"""

    priority: int = Field(ge=1, le=4)
    reason: str


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
