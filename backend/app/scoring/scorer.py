"""
优先级评分逻辑。当前是规则引擎，输出格式和 sklearn 模型完全兼容：

    features = extract_features(ticket, all_tickets)   # -> ScoringFeatures
    result = score(features)                            # -> PriorityResult(priority, reason)

未来换成训练好的模型时，只需要把 score() 内部实现换成
`model.predict(features_to_vector(features))`，输入输出签名不变，
main.py 和其它调用方完全不用改。
"""

from dataclasses import dataclass
from datetime import timedelta
from typing import List

from app.models.schemas import CustomerPlan, PriorityResult, Ticket

RECENT_WINDOW_DAYS = 30
RECENT_TICKET_THRESHOLD = 2  # 30天内（不含本工单）已提交的工单数 >= 这个值才加分

HIGH_PAYING_PLANS = {CustomerPlan.PRO, CustomerPlan.ENTERPRISE}

KEYWORD_GROUPS = {
    "billing": ["扣费", "扣款", "乱扣费", "重复扣费"],
    "login": ["无法登录", "登录失败", "登陆失败", "无法登陆", "登录不了", "登陆不了"],
    "refund": ["退款", "退费"],
}
GROUP_LABELS = {"billing": "扣费异常", "login": "登录失败", "refund": "退款"}

MIN_PRIORITY = 1
MAX_PRIORITY = 4


@dataclass
class ScoringFeatures:
    """
    评分函数的输入特征。未来接真实模型时，把这几个字段转成特征向量喂给
    model.predict() 即可，字段本身不需要变。
    """

    title: str
    content: str
    customer_plan: CustomerPlan
    customer_recent_ticket_count: int  # 同一客户在 RECENT_WINDOW_DAYS 天内（不含本工单）提交的工单数


def extract_features(ticket: Ticket, all_tickets: List[Ticket]) -> ScoringFeatures:
    """从单条工单 + 全量工单上下文中提取评分所需特征"""
    window_start = ticket.created_at - timedelta(days=RECENT_WINDOW_DAYS)
    recent_count = sum(
        1
        for t in all_tickets
        if t.customer_id == ticket.customer_id
        and t.id != ticket.id
        and window_start <= t.created_at < ticket.created_at
    )
    return ScoringFeatures(
        title=ticket.title,
        content=ticket.content,
        customer_plan=ticket.customer_plan,
        customer_recent_ticket_count=recent_count,
    )


def _matched_keyword_groups(text: str) -> List[str]:
    matched = []
    for group, keywords in KEYWORD_GROUPS.items():
        if any(keyword in text for keyword in keywords):
            matched.append(group)
    return matched


def score(features: ScoringFeatures) -> PriorityResult:
    """规则引擎评分。返回优先级(1低-4紧急) + 人类可读理由"""
    priority = MIN_PRIORITY
    reasons: List[str] = []

    text = f"{features.title} {features.content}"
    matched_groups = _matched_keyword_groups(text)
    if matched_groups:
        priority += 1
        labels = "+".join(GROUP_LABELS[g] for g in matched_groups)
        if len(matched_groups) >= 2:
            priority += 1
            reasons.append(f"含{labels}等多重关键词组合，历史平均处理耗时更长")
        else:
            reasons.append(f"含{labels}关键词")

    if features.customer_plan in HIGH_PAYING_PLANS:
        priority += 1
        reasons.append(f"客户为{features.customer_plan.value}高付费套餐，需优先响应")

    if features.customer_recent_ticket_count >= RECENT_TICKET_THRESHOLD:
        priority += 1
        reasons.append(
            f"该客户{RECENT_WINDOW_DAYS}天内已提交{features.customer_recent_ticket_count}次工单，存在反复问题风险"
        )

    priority = min(priority, MAX_PRIORITY)

    if not reasons:
        reasons.append("常规工单，未命中高优先级规则")

    return PriorityResult(priority=priority, reason="；".join(reasons))
