"""
数据源抽象接口 —— 整个"随时切换数据源"架构的核心。

main.py、scorer.py 全部只依赖这个抽象类，从不直接依赖 mock_source 或
real_source 的具体实现。切换数据源只需要改 config.py 里的 DATA_SOURCE
环境变量 + 新建一个实现了这四个方法的类，其他代码一行都不用动。

未来接入真实数据时，新建 real_source.py，写一个 RealTicketDataSource(TicketDataSource)
类，实现下面这四个抽象方法即可。具体步骤见 /backend/README.md。
"""

from abc import ABC, abstractmethod
from typing import List, Optional

from app.models.schemas import AdjustmentLog, DecisionStatus, Ticket


class TicketDataSource(ABC):
    @abstractmethod
    def get_tickets(self) -> List[Ticket]:
        """返回全部工单（未打分的原始数据即可，打分由 scorer.py 负责）"""
        raise NotImplementedError

    @abstractmethod
    def get_ticket(self, ticket_id: str) -> Optional[Ticket]:
        """按 id 取单条工单，找不到返回 None"""
        raise NotImplementedError

    @abstractmethod
    def update_ticket(
        self,
        ticket_id: str,
        *,
        decision_status: DecisionStatus,
        final_priority: int,
    ) -> Ticket:
        """
        人工确认/调整优先级后，把结果写回工单本身。
        mock 数据源可以只更新内存；real 数据源应该写回真实的工单系统/数据库。
        """
        raise NotImplementedError

    @abstractmethod
    def save_adjustment(
        self,
        ticket_id: str,
        original_priority: int,
        adjusted_priority: int,
        action: str,
    ) -> AdjustmentLog:
        """
        记录一次人工决定（确认或调整），用于将来训练真实模型的标注数据。
        建议内部调用 app.storage.adjustment_log 里的函数，保证不同数据源
        写出来的标注数据格式一致。
        """
        raise NotImplementedError
