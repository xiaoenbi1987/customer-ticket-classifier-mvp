"""
FastAPI 入口。这里只做编排（拿数据源 -> 打分 -> 排序 -> 返回），
不包含任何具体的数据来源逻辑或评分规则——那些分别在 data_sources/ 和 scoring/ 里。
"""

from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import ADJUSTMENT_LOG_DB_PATH, CORS_ALLOW_ORIGINS, get_data_source
from app.data_sources.base import TicketDataSource
from app.models.schemas import (
    AdjustmentLog,
    AdjustRequest,
    DecisionStatus,
    StatsResponse,
    Ticket,
)
from app.scoring.scorer import extract_features, score
from app.storage import adjustment_log as adjustment_log_storage

app = FastAPI(title="客服工单智能分类系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _on_startup() -> None:
    adjustment_log_storage.configure(ADJUSTMENT_LOG_DB_PATH)


def _get_ds() -> TicketDataSource:
    return get_data_source()


def _ensure_scored(ticket: Ticket, all_tickets: List[Ticket]) -> Ticket:
    """如果工单还没打过分（suggested_priority为空），调用评分逻辑填充"""
    if ticket.suggested_priority is None:
        features = extract_features(ticket, all_tickets)
        result = score(features)
        ticket.suggested_priority = result.priority
        ticket.suggested_reason = result.reason
        ticket.final_priority = result.priority
    return ticket


def _get_scored_tickets(ds: TicketDataSource) -> List[Ticket]:
    tickets = ds.get_tickets()
    for ticket in tickets:
        _ensure_scored(ticket, tickets)
    return tickets


def _get_scored_ticket_or_404(ds: TicketDataSource, ticket_id: str) -> Ticket:
    all_tickets = ds.get_tickets()
    ticket: Optional[Ticket] = next((t for t in all_tickets if t.id == ticket_id), None)
    if ticket is None:
        raise HTTPException(status_code=404, detail=f"ticket not found: {ticket_id}")
    return _ensure_scored(ticket, all_tickets)


@app.get("/api/tickets", response_model=List[Ticket])
def list_tickets(ds: TicketDataSource = Depends(_get_ds)) -> List[Ticket]:
    tickets = _get_scored_tickets(ds)
    return sorted(tickets, key=lambda t: t.final_priority or 0, reverse=True)


@app.post("/api/tickets/{ticket_id}/confirm", response_model=Ticket)
def confirm_ticket(ticket_id: str, ds: TicketDataSource = Depends(_get_ds)) -> Ticket:
    ticket = _get_scored_ticket_or_404(ds, ticket_id)
    ds.save_adjustment(
        ticket_id=ticket_id,
        original_priority=ticket.suggested_priority,
        adjusted_priority=ticket.suggested_priority,
        action="confirm",
    )
    return ds.update_ticket(
        ticket_id,
        decision_status=DecisionStatus.CONFIRMED,
        final_priority=ticket.suggested_priority,
    )


@app.post("/api/tickets/{ticket_id}/adjust", response_model=Ticket)
def adjust_ticket(
    ticket_id: str, body: AdjustRequest, ds: TicketDataSource = Depends(_get_ds)
) -> Ticket:
    ticket = _get_scored_ticket_or_404(ds, ticket_id)
    ds.save_adjustment(
        ticket_id=ticket_id,
        original_priority=ticket.suggested_priority,
        adjusted_priority=body.new_priority,
        action="adjust",
    )
    return ds.update_ticket(
        ticket_id,
        decision_status=DecisionStatus.ADJUSTED,
        final_priority=body.new_priority,
    )


@app.get("/api/stats", response_model=StatsResponse)
def get_stats(ds: TicketDataSource = Depends(_get_ds)) -> StatsResponse:
    tickets = ds.get_tickets()
    total = len(tickets)

    resolved = [t for t in tickets if t.resolved_at is not None]
    processed = len(resolved)
    pending = total - processed

    avg_handling_time_hours: Optional[float] = None
    if resolved:
        total_seconds = sum(
            (t.resolved_at - t.created_at).total_seconds() for t in resolved
        )
        avg_handling_time_hours = round(total_seconds / len(resolved) / 3600, 1)

    return StatsResponse(
        total=total,
        processed=processed,
        pending=pending,
        avg_handling_time_hours=avg_handling_time_hours,
    )


@app.get("/api/adjustments", response_model=List[AdjustmentLog])
def list_adjustments() -> List[AdjustmentLog]:
    """
    导出全部人工标注记录（确认/调整），供将来训练真实模型使用。

    部署到远端后没法直接打开 SQLite 文件，标注数据必须有一个取出来的出口，
    否则写进去的数据等于拿不回来。
    """
    return adjustment_log_storage.list_adjustments()
