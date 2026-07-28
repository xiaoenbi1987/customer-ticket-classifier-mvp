# 客服工单智能分类系统 — 后端

FastAPI + 规则引擎评分。当前处于过渡期，使用模拟数据；架构已经为"随时切换到真实历史工单数据集"设计好。

## 项目结构

```
backend/
  app/
    main.py                    FastAPI 路由，只做编排，不含具体业务逻辑
    config.py                  DATA_SOURCE 环境变量控制用哪个数据源
    data_sources/
      base.py                  抽象接口 TicketDataSource（唯一的契约）
      mock_source.py           模拟数据源实现（当前使用）
      real_source.py           真实数据源实现（未来新建，见下方"接入真实数据"）
    scoring/
      scorer.py                规则引擎评分逻辑，输入输出格式已对齐未来的ML模型
    models/
      schemas.py                Pydantic 数据模型
    storage/
      adjustment_log.py         人工调整记录持久化（SQLite）
  data/
    adjustment_log.sqlite3      人工调整记录数据库文件（自动创建）
  requirements.txt
  .env.example
```

## 启动方式

```bash
cd backend
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt  # macOS/Linux

cp .env.example .env   # 按需修改 DATA_SOURCE 等配置

./.venv/Scripts/python.exe -m uvicorn app.main:app --port 8000 --reload
```

启动后访问 http://127.0.0.1:8000/docs 可以看到自动生成的 Swagger 交互式文档，
里面能直接在浏览器里测试全部接口（推荐优先用这个，比手写 curl 方便）。

## API 一览与测试方法

### 1. `GET /api/tickets` — 按优先级排序返回全部工单

```bash
curl http://127.0.0.1:8000/api/tickets
```

Postman：新建 GET 请求，URL 填 `http://127.0.0.1:8000/api/tickets`，无需 body。

### 2. `POST /api/tickets/{id}/confirm` — 确认采纳建议优先级

```bash
curl -X POST http://127.0.0.1:8000/api/tickets/T1000/confirm
```

Postman：POST 到 `http://127.0.0.1:8000/api/tickets/T1000/confirm`，无需 body（把 `T1000` 换成 `/api/tickets` 返回结果里任意一个 `id`）。

### 3. `POST /api/tickets/{id}/adjust` — 提交人工调整后的优先级

```bash
curl -X POST http://127.0.0.1:8000/api/tickets/T1000/adjust \
  -H "Content-Type: application/json" \
  -d '{"new_priority": 3}'
```

Postman：POST 到 `http://127.0.0.1:8000/api/tickets/T1000/adjust`，Body 选 `raw` + `JSON`，
填 `{"new_priority": 3}`（`new_priority` 取值范围 1-4）。

### 4. `GET /api/stats` — 统计数据

```bash
curl http://127.0.0.1:8000/api/stats
```

返回 `total`（总数）/ `processed`（已处理，即有 `resolved_at` 的工单数）/ `pending`（待处理）/
`avg_handling_time_hours`（平均处理时长，小时）。

每次 confirm / adjust 都会在 `data/adjustment_log.sqlite3` 里写入一条记录，可以直接用
`sqlite3 data/adjustment_log.sqlite3 "select * from adjustment_log;"` 查看，这些数据就是未来训练
真实模型用的标注样本。

## 接入真实数据集时该怎么做

**核心原则：只新建一个文件，其他代码完全不用改。**

### 第一步：新建 `app/data_sources/real_source.py`

参考 `app/data_sources/mock_source.py` 的写法，实现一个类：

```python
from app.data_sources.base import TicketDataSource

class RealTicketDataSource(TicketDataSource):
    def get_tickets(self) -> list[Ticket]:
        ...  # 从真实数据库/API/CSV读取工单，转换成 Ticket 对象列表返回

    def get_ticket(self, ticket_id: str) -> Ticket | None:
        ...  # 按id查询单条工单

    def update_ticket(self, ticket_id, *, decision_status, final_priority) -> Ticket:
        ...  # 把人工确认/调整的结果写回真实工单系统（数据库 UPDATE 或调用真实系统的API）

    def save_adjustment(self, ticket_id, original_priority, adjusted_priority, action) -> AdjustmentLog:
        # 直接复用现成的存储模块即可，不需要自己写SQLite逻辑：
        from app.storage import adjustment_log as adjustment_log_storage
        return adjustment_log_storage.insert_adjustment(
            ticket_id=ticket_id,
            original_priority=original_priority,
            adjusted_priority=adjusted_priority,
            action=action,
        )
```

只需要实现这 4 个方法，把真实数据"翻译"成 `app/models/schemas.py` 里定义的 `Ticket` 格式即可。

### 第二步：切换配置

修改 `.env`（或环境变量）：

```
DATA_SOURCE=real
```

重启服务即可。`app/config.py` 里的 `get_data_source()` 会自动加载 `RealTicketDataSource`。

### 完全不需要改动的文件

- `app/main.py` — 路由逻辑只依赖抽象接口 `TicketDataSource`，不知道也不关心背后是 mock 还是 real
- `app/scoring/scorer.py` — 评分逻辑只依赖 `Ticket` 对象的字段，跟数据来自哪里无关
- `app/models/schemas.py` — 数据结构定义，除非真实数据有全新字段需要展示，否则不用改
- `app/storage/adjustment_log.py` — 人工调整记录的存储，与数据源无关
- `app/data_sources/mock_source.py` — 会保留下来，方便以后本地开发/演示时用 `DATA_SOURCE=mock` 切回去

### 何时需要额外改动（超出"只新建一个文件"的情况）

- 如果真实工单数据里有 `scorer.py` 目前没用到、但对评分有价值的新字段（比如"客户历史投诉次数"），
  需要在 `scoring/scorer.py` 的 `ScoringFeatures` 里加字段，并在 `extract_features()` 里提取——
  这是评分规则的自然演进，跟"切换数据源"是两件事。
- 如果未来把规则引擎换成训练好的 sklearn/其它模型，只需要改 `scoring/scorer.py` 里 `score()` 函数
  的内部实现（比如改成 `model.predict(feature_vector)`），输入输出签名 (`ScoringFeatures` ->
  `PriorityResult`) 保持不变，`main.py` 不用动。
