"""
全局配置。切换数据源只需要改这里读到的 DATA_SOURCE 环境变量：

    DATA_SOURCE=mock   -> 使用 app.data_sources.mock_source.MockTicketDataSource
    DATA_SOURCE=real   -> 使用 app.data_sources.real_source.RealTicketDataSource（未来实现）

main.py、scoring/、storage/ 都不直接 import mock_source 或 real_source，
全部通过 get_data_source() 拿到抽象接口 TicketDataSource 的实例。
"""

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_SOURCE = os.getenv("DATA_SOURCE", "mock").lower()
ADJUSTMENT_LOG_DB_PATH = Path(
    os.getenv("ADJUSTMENT_LOG_DB_PATH") or str(BASE_DIR / "data" / "adjustment_log.sqlite3")
)
CORS_ALLOW_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]


@lru_cache
def get_data_source():
    """
    返回 TicketDataSource 单例。用 lru_cache 保证 mock 数据源的内存状态
    （比如人工确认/调整后的结果）在同一进程内的多次请求间保持一致。
    """
    from app.data_sources.base import TicketDataSource  # noqa: F401  (类型提示用)

    if DATA_SOURCE == "mock":
        from app.data_sources.mock_source import MockTicketDataSource

        return MockTicketDataSource()

    if DATA_SOURCE == "real":
        from app.data_sources.real_source import RealTicketDataSource

        return RealTicketDataSource()

    raise ValueError(f"未知的 DATA_SOURCE: {DATA_SOURCE!r}，只能是 'mock' 或 'real'")
