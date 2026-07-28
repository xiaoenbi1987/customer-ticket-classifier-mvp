"""
人工调整记录的持久化层，基于 SQLite。

这是唯一负责读写 adjustment_log 的模块——不管以后换 mock 还是 real 数据源，
只要调用这里的 insert_adjustment / list_adjustments，就能保证标注数据格式统一，
方便将来直接导出去训练真实模型。
"""

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator, List, Optional

from app.models.schemas import AdjustmentLog

_DB_PATH: Optional[Path] = None


def configure(db_path: Path) -> None:
    """由 config.py 在启动时调用一次，指定 SQLite 文件位置"""
    global _DB_PATH
    _DB_PATH = db_path
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    _init_schema()


def _get_db_path() -> Path:
    if _DB_PATH is None:
        raise RuntimeError("adjustment_log 尚未 configure()，请检查 config.py 是否在启动时调用了它")
    return _DB_PATH


@contextmanager
def _connect() -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(_get_db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def _init_schema() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS adjustment_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id TEXT NOT NULL,
                original_priority INTEGER NOT NULL,
                adjusted_priority INTEGER NOT NULL,
                action TEXT NOT NULL,
                adjusted_at TEXT NOT NULL
            )
            """
        )


def insert_adjustment(
    ticket_id: str,
    original_priority: int,
    adjusted_priority: int,
    action: str,
) -> AdjustmentLog:
    adjusted_at = datetime.now(timezone.utc)
    with _connect() as conn:
        cursor = conn.execute(
            """
            INSERT INTO adjustment_log
                (ticket_id, original_priority, adjusted_priority, action, adjusted_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (ticket_id, original_priority, adjusted_priority, action, adjusted_at.isoformat()),
        )
        return AdjustmentLog(
            id=cursor.lastrowid,
            ticket_id=ticket_id,
            original_priority=original_priority,
            adjusted_priority=adjusted_priority,
            action=action,
            adjusted_at=adjusted_at,
        )


def list_adjustments() -> List[AdjustmentLog]:
    """导出所有标注数据，未来训练真实模型时从这里取历史标注"""
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM adjustment_log ORDER BY adjusted_at DESC"
        ).fetchall()
        return [
            AdjustmentLog(
                id=row["id"],
                ticket_id=row["ticket_id"],
                original_priority=row["original_priority"],
                adjusted_priority=row["adjusted_priority"],
                action=row["action"],
                adjusted_at=row["adjusted_at"],
            )
            for row in rows
        ]
