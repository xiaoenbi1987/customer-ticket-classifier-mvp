# PriorAI — 客服工单智能分类系统
### AI Product Portfolio Case Study #2

---

## 1. Project in One Sentence

**中文**：为一家中型SaaS公司的客服团队，设计并构建了一个基于历史数据自动识别工单真实紧急度的分类工具，把人工每天1.5小时的手动分类时间，转化为一个"AI建议 + 人工确认/纠正"的工作流。

**EN**：Designed and built a triage tool that uses historical data to automatically score customer support ticket urgency, replacing 1.5 hours of daily manual sorting with an AI-suggest / human-confirm workflow.

---

## 2. Business Problem

**中文**：TechFlow（约500人SaaS公司，服务中小企业，客户按月付费）的四人客服团队每周处理200-300个工单。团队成员每天早上要花1.5小时人工阅读、判断优先级、手动分类，之后才能开始真正回复客户。更严重的是，判断依据只有工单标题这类表面信息，导致高风险问题被误判——曾有一个严重账单问题因标题看似普通咨询，被压在队列里4小时才处理，客户严重不满。公司实际上已经积累了工单类型、渠道、优先级、解决时长、满意度等历史数据，但从未被用来辅助这个判断过程。

**EN**：TechFlow's 4-person support team spends 1.5 hours every morning manually triaging 200-300 tickets before responding to customers, using only surface cues like ticket titles. This caused a real incident: a serious billing issue was misjudged as routine and sat unhandled for 4 hours. The company already had relevant historical data (type, channel, priority, resolution time, satisfaction) — it was simply never used to inform triage decisions.

---

## 3. Target User

**中文**：Jordan，TechFlow四人客服团队中的Support Specialist。负责回复邮件/聊天/电话工单、分类、判断优先级、升级复杂问题给工程师、记录解决方案。不是决策者，是每天在一线处理工单的执行者——这决定了产品设计必须"减少她的认知负担"，而不是"要求她学习新系统"。

**EN**：Jordan, a front-line Support Specialist — not a manager or decision-maker. This shaped a key design constraint: the product had to reduce her daily cognitive load, not add a new system she has to learn and maintain.

---

## 4. Why AI / Why Not Just Rules

**中文**：这是本项目里我做出的第一个关键产品判断——**MVP阶段刻意选择了纯规则系统，而不是一开始就上机器学习模型**。理由：
- 冷启动阶段没有标注数据，机器学习模型无法训练，也无法验证效果
- 规则系统的判断逻辑透明、可解释（"为什么这条工单被标紧急" 可以清楚展示给Jordan看），信任成本低
- Jordan明确在需求邮件里说"不要复杂系统"，规则系统的实现和维护成本远低于ML pipeline

AI（未来的机器学习模型）真正的价值不在"现在"，而在**积累了足够的人工纠正数据之后**——这是一个刻意设计的演进路径，而不是"能力不足只能先做规则"。

**EN**：A deliberate product decision, not a technical limitation: start with transparent, explainable rules (no training data exists yet; trust matters more than sophistication for a first release), and treat ML as something the product *earns* once enough human-correction data accumulates — not something bolted on for its own sake.

---

## 5. MVP User Flow

**中文**：
1. 新工单到达（邮件/聊天/电话）
2. 系统基于历史模式规则打标签+优先级评分，附带人类可读的判断理由
3. 仪表盘展示按风险排序的工单列表
4. Jordan一键"确认"采纳，或点击"调整"手动修改
5. 工单路由到对应队列
6. 每次调整写入日志，作为未来模型训练的标注数据

**EN**：Ticket arrives → rule-based scoring with a stated reason → sorted dashboard → one-click confirm or manual adjust → routed to queue → every correction is logged as future training data.

---

## 6. Current Technical Architecture

**中文**：
- **后端**：Python + FastAPI，暴露 `/api/tickets`（获取打分后列表）、`/api/tickets/{id}/confirm`、`/api/tickets/{id}/adjust`、`/api/stats`、`/api/adjustments`（导出人工标注记录）五个接口
- **评分逻辑**：`scorer.py`，基于关键词组合、客户套餐等级、30天内重复提单等规则打分，返回**结构化规则命中列表**（而不是写死的句子），前端根据当前语言拼接成对应文案——这是为支持中英文双语理由展示做的架构决策
- **数据源抽象层**：定义了 `TicketDataSource` 接口（`get_tickets` / `save_adjustment`），当前实现是 `mock_source.py`；预留了 `real_source.py` 位置，接入真实数据只需新增该文件+切换环境变量，其余代码不动
- **人工纠正存储**：`adjustment_log`，落地在SQLite
- **前端**：Next.js仪表盘，工单列表、统计卡片、优先级标签、判断理由展示、确认/调整交互；已实现中英文界面切换（UI固定文案已双语化，评分理由已结构化双语化）
- **版本控制**：项目已推送到公开GitHub仓库（customer-ticket-classifier-mvp），本地分支已跟踪远程

**EN**：Python/FastAPI backend with 5 REST endpoints; rule engine returns structured "which rules fired" data (not hardcoded strings) so both languages render from the same source of truth; an abstract `TicketDataSource` interface decouples business logic from the data source, so swapping mock data for a real dataset requires adding one file, not rewriting the app; corrections are persisted to SQLite; Next.js dashboard with working bilingual UI; version-controlled on a public GitHub repo.

---

## 7. What Is Actually Built Today (Built)

- ✅ 后端API可运行，五个端点均已联调验证
- ✅ 基于规则的评分引擎，含判断理由生成
- ✅ 前端仪表盘，含工单列表/统计卡片/确认调整交互，实际可点击操作
- ✅ 人工调整记录落库（SQLite）
- ✅ 数据源抽象接口设计，为未来接入真实数据预留扩展点
- ✅ 中英文界面切换（UI固定文案 + 评分理由结构化双语）
- ✅ 项目已上GitHub，可版本追溯

**EN**: Working end-to-end MVP — backend API, rule-based scorer with explainable reasons, clickable frontend dashboard, correction logging to SQLite, an abstracted data-source layer, working bilingual UI, and version control on GitHub.

---

## 8. What Is NOT Built Yet (Prototype / Future — 明确未完成)

- ❌ **真实数据接入**：目前仍运行在模拟数据上，`real_source.py` 尚未编写，未连接TechFlow真实工单系统
- ❌ **机器学习模型**：当前是纯规则打分，尚未训练任何ML模型；从规则系统演进到ML模型的路径已设计（阶段2权重调整 → 阶段3训练模型 → 阶段4持续再训练），但**尚未实现任何一个阶段**
- ❌ **工单原始内容的机器翻译**：客户提交的工单标题/描述目前保持原语言不翻译（这是刻意的设计边界，不是遗漏），若要支持"英文界面下工单内容也显示英文"，需要接入真实翻译API，目前仅处于方案对比阶段，尚未选型和实现
- ❌ **自动化测试覆盖**：目前是人工点击验证，没有自动化单元测试/集成测试
- ❌ **自动升级给工程师**：MVP阶段人工确认升级，未做自动化路由

**EN**: Explicitly not done — no real data connected yet (only the extension point exists), no ML model trained (only the roadmap is designed), no machine translation for user-generated ticket content, no automated test suite, no auto-escalation to engineers.

---

## 9. Human-in-the-loop Feedback Loop

**中文**：这是产品设计的核心机制，不是附加功能。Jordan每次"确认"或"调整"都会被记录（工单ID、系统建议优先级、人工最终优先级、时间戳）。这个记录的定位很明确：**它不是日志，是未来模型的训练标注数据**。设计上刻意保留了"人工可以随时否决AI建议"的控制权，理由：
1. 客服场景里，误判的代价（客户流失）远高于让AI暂时"不够准"的代价
2. 人工纠正的可信度取决于Jordan是否感到自己仍有最终决定权，而不是被系统替代

**EN**: Every confirm/adjust action is logged as a labeled training example, not just an activity log. The human always retains override authority by design — because in support triage, a wrong auto-decision costs more than a temporarily "good enough" one, and trust depends on the human still feeling in control, not replaced.

---

## 10. How the System Evolves from Rules → AI/ML

| 阶段 Stage | 说明 Description | 数据量参考 Data volume |
|---|---|---|
| 阶段1：纯规则系统（**当前所在阶段**） | 人工设定的if-else规则 | 0条纠正数据 |
| 阶段2：规则+人工纠正加权 | 用纠正数据手动调整规则权重，不需要ML基础设施 | 几十到几百条 |
| 阶段3：正式机器学习模型 | 用累积纠正记录训练分类/评分模型 | 数百至上千条 |
| 阶段4：持续再训练 | 定期用新纠正数据重训模型，持续变准 | 滚动迭代 |

**中文**：这个演进路径是产品设计阶段就规划好的，而不是"做不动ML所以先凑合用规则"。刻意标注"当前所在阶段"，是因为在CEO面前诚实说明进度，比展示一个夸大完成度的路线图更重要。

**EN**: This is a planned evolution, not a fallback. Clearly marking "we are at Stage 1 today" is a deliberate choice — an honest maturity map is more credible to a CEO than an inflated one.

---

## 11. 3 Most Important AI Product Decisions I Made

**1. 先规则、后AI，把"AI"当作产品要挣得的能力，而不是默认起点**
中文：拒绝了"一上来就用大模型/机器学习"的诱惑，理由是可解释性和信任成本，在没有标注数据前，规则系统是更负责任的第一版。
EN: Chose explainability and trust over sophistication for v1 — AI is something the product earns once labeled data exists, not a default starting point.

**2. 把评分理由设计成"结构化规则命中 + 双语模板"，而不是让后端直接生成写死的句子**
中文：这个架构决策直接决定了后续能否支持多语言，是一个"现在看起来是小事，但决定未来能不能扩展"的关键判断。
EN: Structuring reasons as rule-hit data (rather than hardcoded sentences) was a small-looking decision that determined whether internationalization was even possible later.

**3. 坚持保留人工的最终否决权，并把每次纠正设计为未来训练数据，而不只是操作日志**
中文：把"人工调整"从一个UI交互，重新定义为"数据资产积累机制"，这是把Human-in-the-loop从概念变成实际产品机制的关键一步。
EN: Reframing "human adjustment" from a UI interaction into a data-asset accumulation mechanism is what turns "human-in-the-loop" from a buzzword into an actual product mechanism.

---

## 12. What This Project Demonstrates About My AI Product Management Ability

**中文**：
- 能从一封客服人员的抱怨邮件，倒推出结构化的Problem Statement、Root Cause（5 Whys）、Solution，说明具备**从业务问题定义AI产品**的能力
- 主动选择"规则优先于AI"，说明理解**AI不是万能钥匙**，知道什么阶段该用什么工具
- 设计了完整的反馈闭环和阶段演进路径，说明理解**数据、模型、人工反馈之间如何协作**，而不是把AI当黑箱调用
- 提出数据源抽象接口设计、结构化理由+双语架构，说明具备**足够的技术理解，能和工程师进行有意义的架构讨论**，而不是只会写prompt
- 清楚区分Built/Prototype/Future，说明具备**诚实评估项目成熟度**的判断力,这是AI PM区别于"AI爱好者"的关键素质

**EN**: This project shows the ability to translate a frontline complaint into a structured problem definition; the judgment to choose rules over ML deliberately rather than by default; a real understanding of how data, models, and human feedback interact as a system rather than a black box; enough technical fluency to make architecture calls (not just prompt LLMs); and — perhaps most importantly — the discipline to report project maturity honestly rather than inflate it.

---

## 13. 3 Screenshots/Screens for the Portfolio

**中文**：
1. **仪表盘主界面截图**——展示工单列表按优先级排序、判断理由、确认/调整按钮，这是最能体现"AI建议+人工决策"交互设计的一张
2. **中英文切换效果对比图**（同一界面的中文态和英文态并排）——体现国际化架构思考，而不只是功能堆砌
3. **架构/演进路径图**（数据源抽象层示意图，或"规则→AI"四阶段演进图）——体现你能讲清楚系统的技术脉络和成长路径，而不只是展示成品截图

**EN**: (1) The main dashboard showing sorted tickets with reasons and confirm/adjust actions — the clearest demonstration of the suggest-then-decide interaction. (2) A side-by-side ZH/EN toggle comparison — shows internationalization was architected, not bolted on. (3) The architecture/evolution diagram — shows you can narrate the system's technical trajectory, not just its current UI.

---

## 14. Which Existing Files/Documents Are Worth Sending to a CEO

**中文**：
- 之前生成的PDF《从想法到MVP：可复用的AI协作产品开发流程》——但**建议只发其中的Product Card、五步故事板、数据集协作机制这几部分**，跳过"Claude Code操作步骤"这类过程性内容（CEO不需要看你怎么用工具，只需要看你的产品判断）
- `backend/README.md`——里面记录的"未来接入真实数据步骤"说明，能直接体现你的架构预留是有意为之
- 本Portfolio Case Study本身
- 如果可以的话，一段30秒左右的仪表盘操作录屏，比任何文档都更有说服力

**EN**: Send the Product Card / storyboard / data-loop sections from the earlier PDF (skip the Claude Code tooling walkthrough — a CEO doesn't need the how, just the product thinking), the `backend/README.md` future-integration notes as proof the extensibility was intentional, this case study itself, and ideally a 30-second screen recording of the live dashboard — more persuasive than any document.

---

## 15. The 60-Second Explanation

**中文（口述版）**：
> "我发现一家SaaS公司的客服团队,每天要花1.5小时人工分类200-300个工单，还是会漏掉重要问题——上周就有一个严重账单问题被误判耽误了4小时，客户很不满。他们其实有历史数据，只是没被用起来。我做的是一个分类工具：基于历史数据自动给工单打优先级和理由，客服一眼就能看到该先处理什么，一键确认或手动纠正。这不是让AI替她做决定，而是让AI把'该关注什么'提前排好序，人始终有最终决定权。现在的MVP用的是规则系统，故意没有一上来就用机器学习——因为还没有足够的标注数据，规则更透明、更容易被信任。但架构上已经为未来演进做好了准备：客服每次的人工纠正，都会变成训练数据，用来逐步把规则升级成真正的AI模型。目前后端、前端、双语界面都已经跑通并且推送到了代码仓库，但还没有接入真实数据，AI模型部分也还在路线图阶段，没有开始训练。"

**EN (spoken version)**:
> "I found that a SaaS company's support team spends 1.5 hours every morning manually triaging 200-300 tickets — and still misses important ones. I built a tool that scores tickets by urgency using historical data, with a visible reason for every score, so the agent can see what to handle first and confirm or override in one click. It's not AI replacing judgment — it's AI pre-sorting attention while the human keeps final say. Today it deliberately runs on rules, not machine learning, because there isn't enough labeled data yet and rules are more trustworthy at this stage — but the architecture is built so every human correction becomes training data for a future model. The backend, frontend, and bilingual UI all work end-to-end and are on GitHub. Real data and the ML model are the next steps, not done yet."

