# PriorAI — 客服工单智能分类系统

> 为客服团队做的工单优先级分诊工具：系统给出带理由的优先级建议，人工一键确认或纠正，每一次纠正都被存成未来训练模型的标注数据。

**▶️ [观看 Demo（2 分钟）](https://www.loom.com/share/e4f745ddea744dc7a41c22ededa35a4a)**

**这是一个 AI 产品设计的作品集项目（Portfolio Case Study #2），不是生产系统。** 当前运行在模拟数据上，用于展示产品判断与架构设计，未接入任何真实客户数据。

📄 完整案例研究（问题定义、用户、产品决策、演进路径）：[PriorAI_Portfolio_Case_Study.md](PriorAI_Portfolio_Case_Study.md) · 🇬🇧 [English README](README.md)

---

## 要解决的问题

一个四人客服团队每周处理 200–300 个工单，每天早上要先花 1.5 小时人工阅读、判断优先级、分类，之后才能开始真正回复客户。判断依据只有工单标题这类表面信息，导致过高风险问题被误判——曾有一个严重账单问题因标题看似普通，被压在队列里 4 小时。

而公司其实已经积累了工单类型、渠道、优先级、解决时长等历史数据，只是从没被用来辅助这个判断。

---

## 三个核心产品判断

**1. 先规则，后 AI——把"AI"当作产品要挣得的能力，而不是默认起点**

冷启动阶段没有任何标注数据，ML 模型既训不出来也验证不了效果。更关键的是，一线客服需要知道"为什么这条被标成紧急"才会信任系统。所以 v1 刻意选择透明可解释的规则引擎。

这是产品判断，不是技术妥协——ML 的价值在积累够人工纠正数据**之后**才出现。

**2. 评分理由是结构化的规则命中数据，不是后端拼好的句子**

`scorer.py` 返回的是 `[{rule, params}]`，前端按当前语言渲染文案。这个看起来很小的决定，直接决定了后来中英双语能不能做——如果后端直接返回中文句子，国际化就是不可能的。

**3. 人工纠正被定义为数据资产，不是操作日志**

每次确认/调整都记录（工单 ID、系统建议值、人工最终值、时间戳），落在独立的 `adjustment_log` 存储层。把"人工调整"从一个 UI 交互重新定义为"训练数据积累机制"，是让 human-in-the-loop 从概念变成实际产品机制的那一步。

---

## 当前进度（诚实版）

**已完成**
- ✅ FastAPI 后端，5 个接口全部联调验证
- ✅ 规则评分引擎，输出可解释的命中规则
- ✅ Next.js 仪表盘，工单排序 / 统计卡片 / 确认调整交互，可实际点击操作
- ✅ 人工纠正落库（SQLite）+ 导出接口
- ✅ 数据源抽象层，为接入真实数据预留扩展点
- ✅ 中英文界面切换（UI 文案 + 评分理由均已双语化）

**未完成**（是当前边界，不是遗漏）
- ❌ 真实数据接入——`real_source.py` 尚未编写，仍跑在模拟数据上
- ❌ 机器学习模型——演进路径已设计，但四个阶段一个都还没实现
- ❌ 工单原始内容的机器翻译——刻意的设计边界，见 [backend/README.md](backend/README.md)
- ❌ 自动化测试——目前是人工点击验证
- ❌ 自动升级路由

## 从规则演进到 ML 的路径

| 阶段 | 做法 | 需要的纠正数据量 |
|---|---|---|
| **阶段 1（当前）** | 人工设定的规则引擎 | 0 条 |
| 阶段 2 | 用纠正数据手动调整规则权重，不需要 ML 基础设施 | 几十到几百条 |
| 阶段 3 | 用累积的纠正记录训练分类/评分模型 | 数百至上千条 |
| 阶段 4 | 定期用新数据重训，持续变准 | 滚动迭代 |

明确标注"当前在阶段 1"是刻意的——诚实的成熟度地图比夸大的路线图更可信。

---

## 技术架构

```
backend/                          Python + FastAPI
  app/
    main.py                       路由编排，不含业务逻辑
    config.py                     DATA_SOURCE 环境变量控制数据源
    data_sources/
      base.py                     TicketDataSource 抽象接口（架构核心）
      mock_source.py              模拟数据源（当前）
      real_source.py              真实数据源（未来新建，接口已定义）
    scoring/scorer.py             规则引擎，输入输出签名对齐未来的 ML 模型
    storage/adjustment_log.py     人工纠正持久化，唯一的标注数据写入口
frontend/                         Next.js 16 + React 19 + Tailwind 4
  app/page.tsx                    仪表盘
  lib/i18n/                       中英双语文案模板
```

两个关键的可扩展点：

- **换数据源不用改业务代码**：`main.py` 和 `scorer.py` 只依赖抽象接口 `TicketDataSource`。接入真实数据 = 新增一个实现该接口的文件 + 切换环境变量，其余代码一行不动。
- **换评分逻辑不用改调用方**：`score(features)` 的签名和 sklearn 模型兼容，未来替换成 `model.predict(...)` 时，调用方无感知。

### 当前的评分规则

优先级 1（低）–4（紧急），命中规则累加：

| 规则 | 加分 |
|---|---|
| 命中一组关键词（扣费 / 登录 / 退款） | +1 |
| 同时命中两组以上关键词 | 再 +1 |
| 客户属于 Pro / Enterprise 套餐 | +1 |
| 同一客户 30 天内已提交 ≥2 个工单 | +1 |

### API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/tickets` | 打分并按优先级排序的工单列表 |
| POST | `/api/tickets/{id}/confirm` | 采纳系统建议 |
| POST | `/api/tickets/{id}/adjust` | 人工修改优先级 |
| GET | `/api/stats` | 处理量/待处理/平均处理时长 |
| GET | `/api/adjustments` | 导出全部人工标注记录 |

---

## 本地运行

**后端**（默认 http://localhost:8000）

```bash
cd backend
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt  # macOS/Linux
cp .env.example .env
./.venv/Scripts/python.exe -m uvicorn app.main:app --port 8000 --reload
```

**前端**（默认 http://localhost:3000）

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

两个 `.env.example` 里写清楚了每个变量的作用；后端接口文档在 http://localhost:8000/docs。

---

## 延伸阅读

- [PriorAI_Portfolio_Case_Study.md](PriorAI_Portfolio_Case_Study.md) — 完整案例研究：业务问题、目标用户、为什么不直接上 ML、人机协作闭环设计
- [backend/README.md](backend/README.md) — 后端架构细节，以及"如何接入真实数据"的具体步骤
