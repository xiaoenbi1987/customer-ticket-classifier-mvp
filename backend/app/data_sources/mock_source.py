"""
模拟工单数据源。实现 TicketDataSource 接口，在内存里生成一批带有各种
特征组合（关键词、付费套餐、同客户多次提单）的假工单，方便联调和演示评分逻辑。

真实数据接入时，不需要改这个文件——新建 real_source.py 实现同样的接口即可，
main.py 完全不感知这里是 mock 还是 real。

关于 title_en / content_en：这是每条模拟工单预先配好的英文翻译，仅用于 MVP 演示
阶段"切到英文界面时工单内容也显示英文"的效果。这种"一份数据配两个语言字段"的
做法只对固定的模拟数据成立——详见 backend/README.md 里的说明，接入真实客户工单
后不能照搬这个方式。
"""

import random
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from app.data_sources.base import TicketDataSource
from app.models.schemas import AdjustmentLog, CustomerPlan, DecisionStatus, Ticket
from app.storage import adjustment_log as adjustment_log_storage

_SEED = 42

# (title, content, title_en, content_en) 模板池，覆盖：单一关键词 / 关键词组合 / 无关键词的常规问题
# title_en/content_en 是人工配的英文翻译，只用于演示，不是真实客户的原始输入。
_TICKET_TEMPLATES = [
    (
        "无法登录账号，且被重复扣费",
        "最近三次登录都失败，同时发现本月被扣费两次，请尽快处理",
        "Unable to log in and charged twice",
        "My last three login attempts all failed, and I noticed I was charged twice this month. Please resolve this as soon as possible.",
    ),
    (
        "申请退款，登录失败无法自助操作",
        "服务一直登陆不上，想申请退款但找不到入口",
        "Requesting a refund, but login failure blocks self-service",
        "I can't log into the service at all and want to request a refund, but I can't find where to do it.",
    ),
    (
        "账户余额扣费异常",
        "本月账单比平时多扣了一笔钱，请核实",
        "Unexpected charge on account balance",
        "This month's bill has an extra charge compared to usual. Please verify.",
    ),
    (
        "打开APP后无法登录",
        "输入正确密码后一直提示登录失败",
        "Can't log in after opening the app",
        "It keeps showing a login failure even though I entered the correct password.",
    ),
    (
        "想申请退款",
        "使用体验不佳，希望申请全额退款",
        "Requesting a refund",
        "The experience hasn't been great, and I'd like to request a full refund.",
    ),
    (
        "页面加载很慢",
        "最近几天打开工作台经常转圈，加载要十几秒",
        "Page loads very slowly",
        "The workspace has been spinning for several seconds when I open it these past few days.",
    ),
    (
        "打印机连接不上系统",
        "办公室新打印机始终无法在系统里添加成功",
        "Printer won't connect to the system",
        "Our new office printer can never be added to the system successfully.",
    ),
    (
        "发票信息有误，需要更新",
        "上个月的发票抬头写错了，麻烦重新开一张",
        "Invoice information is incorrect and needs updating",
        "Last month's invoice had the wrong billing name. Please reissue it.",
    ),
    (
        "希望增加导出Excel功能",
        "现在只能导出PDF，想要Excel格式方便二次处理",
        "Requesting an Excel export feature",
        "Currently only PDF export is available. An Excel format would make further processing easier.",
    ),
    (
        "登录失败并且提示扣费失败",
        "登陆不了，同时收到扣款失败的短信通知",
        "Login failure along with a payment failure notice",
        "I can't log in, and I also received a text message about a failed payment.",
    ),
    (
        "界面显示错位",
        "在Windows上侧边栏和主内容区有重叠",
        "UI elements are misaligned",
        "On Windows, the sidebar overlaps with the main content area.",
    ),
    (
        "咨询套餐升级流程",
        "想从基础版升级到专业版，怎么操作",
        "Asking about the plan upgrade process",
        "I'd like to upgrade from the Basic plan to the Pro plan — how do I do that?",
    ),
    (
        "批量导入数据报错",
        "上传CSV文件时提示格式错误，但文件是按模板填的",
        "Error during bulk data import",
        "Uploading a CSV file shows a format error, even though the file follows the template.",
    ),
    (
        "退费申请一直没有进展",
        "一周前提交的退费申请到现在还没收到回复",
        "No progress on my refund request",
        "I submitted a refund request a week ago and still haven't heard back.",
    ),
    (
        "账号无法登陆，疑似被盗",
        "登录不了，且收到异地登录提醒，怀疑账号被盗用",
        "Can't log in, account possibly compromised",
        "I can't log in, and I received an alert about a login from an unfamiliar location — I suspect my account has been compromised.",
    ),
]

_CUSTOMERS = [
    ("C1001", "张伟", CustomerPlan.ENTERPRISE),
    ("C1002", "李娜", CustomerPlan.PRO),
    ("C1003", "王芳", CustomerPlan.BASIC),
    ("C1004", "刘洋", CustomerPlan.FREE),
    ("C1005", "陈静", CustomerPlan.PRO),
    ("C1006", "杨帆", CustomerPlan.BASIC),
    ("C1007", "赵磊", CustomerPlan.FREE),
    ("C1008", "周敏", CustomerPlan.ENTERPRISE),
]

# 这些客户会在30天内被安排提交多张工单，用来触发"频繁提单"规则
_FREQUENT_CUSTOMER_IDS = {"C1002", "C1006"}

TICKET_COUNT = 42


def _generate_mock_tickets() -> Dict[str, Ticket]:
    rng = random.Random(_SEED)
    now = datetime.now(timezone.utc)
    tickets: Dict[str, Ticket] = {}

    for i in range(TICKET_COUNT):
        ticket_id = f"T{1000 + i}"
        title, content, title_en, content_en = rng.choice(_TICKET_TEMPLATES)
        customer_id, customer_name, plan = rng.choice(_CUSTOMERS)

        if customer_id in _FREQUENT_CUSTOMER_IDS:
            # 频繁客户的工单都集中在最近 30 天内，制造"30天内多次提单"的场景
            created_at = now - timedelta(days=rng.uniform(0, 29), hours=rng.uniform(0, 23))
        else:
            created_at = now - timedelta(days=rng.uniform(0, 60), hours=rng.uniform(0, 23))

        resolved_at: Optional[datetime] = None
        if rng.random() < 0.4:
            resolved_at = created_at + timedelta(hours=rng.uniform(1, 30))

        tickets[ticket_id] = Ticket(
            id=ticket_id,
            title=title,
            content=content,
            title_en=title_en,
            content_en=content_en,
            customer_id=customer_id,
            customer_name=customer_name,
            customer_plan=plan,
            created_at=created_at,
            resolved_at=resolved_at,
            decision_status=DecisionStatus.PENDING,
            suggested_priority=None,
            suggested_reason=None,
            final_priority=None,
        )

    return tickets


class MockTicketDataSource(TicketDataSource):
    def __init__(self) -> None:
        self._tickets: Dict[str, Ticket] = _generate_mock_tickets()

    def get_tickets(self) -> List[Ticket]:
        return list(self._tickets.values())

    def get_ticket(self, ticket_id: str) -> Optional[Ticket]:
        return self._tickets.get(ticket_id)

    def update_ticket(
        self,
        ticket_id: str,
        *,
        decision_status: DecisionStatus,
        final_priority: int,
    ) -> Ticket:
        ticket = self._tickets.get(ticket_id)
        if ticket is None:
            raise KeyError(f"ticket not found: {ticket_id}")
        ticket.decision_status = decision_status
        ticket.final_priority = final_priority
        return ticket

    def save_adjustment(
        self,
        ticket_id: str,
        original_priority: int,
        adjusted_priority: int,
        action: str,
    ) -> AdjustmentLog:
        return adjustment_log_storage.insert_adjustment(
            ticket_id=ticket_id,
            original_priority=original_priority,
            adjusted_priority=adjusted_priority,
            action=action,
        )
