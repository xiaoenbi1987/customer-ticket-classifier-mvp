# PriorAI — Support Ticket Triage System

> A triage tool for customer support teams: the system suggests a ticket priority **with an explainable reason**, the human confirms or corrects it in one click, and every correction is stored as labeled training data for a future model.

**▶️ [Watch the demo (2 min)](https://www.loom.com/share/e4f745ddea744dc7a41c22ededa35a4a)** — currently narrated in Mandarin; an English version is in progress.

**This is an AI product portfolio case study, not a production system.** It runs on mock data and exists to demonstrate product judgment and architecture decisions — no real customer data is connected.

📄 Full case study (problem definition, user, product decisions, evolution path): [PriorAI_Portfolio_Case_Study.md](PriorAI_Portfolio_Case_Study.md) · 🇨🇳 [中文版 README](README.zh-CN.md)

---

## The Problem

A four-person support team handles 200–300 tickets a week. Every morning they spend 1.5 hours reading, judging priority, and sorting tickets before they can start actually replying to customers. The only signal they have is surface-level information like the ticket title — which caused a real incident: a serious billing problem looked like a routine question, sat in the queue for 4 hours, and the customer escalated.

Meanwhile the company already had historical data — ticket type, channel, priority, resolution time, satisfaction — that had never been used to inform that judgment.

---

## Three Core Product Decisions

**1. Rules first, AI later — treat "AI" as a capability the product earns, not a default starting point**

At cold start there is no labeled data, so an ML model can neither be trained nor validated. More importantly, a front-line support specialist needs to see *why* a ticket was flagged urgent before she will trust the system. So v1 deliberately uses a transparent, explainable rule engine.

This is a product decision, not a technical compromise — ML becomes valuable only **after** enough human corrections accumulate.

**2. Scoring reasons are structured rule-hit data, not sentences assembled by the backend**

`scorer.py` returns `[{rule, params}]`, and the frontend renders the text in the current language. This small-looking decision is what made bilingual support possible at all — had the backend returned finished Chinese sentences, internationalization would have been off the table.

**3. Human corrections are defined as a data asset, not an activity log**

Every confirm/adjust action is recorded (ticket ID, suggested priority, final human priority, timestamp) in a dedicated `adjustment_log` storage layer. Reframing "human adjustment" from a UI interaction into a training-data accumulation mechanism is the step that turns human-in-the-loop from a buzzword into an actual product mechanism.

---

## Project Status (the honest version)

**Built**
- ✅ FastAPI backend, all 5 endpoints verified end to end
- ✅ Rule-based scoring engine with explainable rule hits
- ✅ Next.js dashboard — sorted ticket list, stat cards, working confirm/adjust interaction
- ✅ Human corrections persisted to SQLite, plus an export endpoint
- ✅ Data-source abstraction layer as the extension point for real data
- ✅ Bilingual UI (both static copy and scoring reasons)

**Not built** — these are the current boundaries, not oversights
- ❌ Real data integration — `real_source.py` is not written yet; still running on mock data
- ❌ ML model — the evolution path is designed, but none of the four stages is implemented
- ❌ Machine translation of user-submitted ticket content — a deliberate scope boundary, see [backend/README.md](backend/README.md)
- ❌ Automated tests — verification is currently manual
- ❌ Auto-escalation routing

## How This Evolves from Rules to ML

| Stage | Approach | Corrections needed |
|---|---|---|
| **Stage 1 (current)** | Hand-written rule engine | 0 |
| Stage 2 | Manually reweight rules using correction data — no ML infrastructure required | tens to hundreds |
| Stage 3 | Train a real classification/scoring model on accumulated corrections | hundreds to thousands |
| Stage 4 | Periodic retraining on new corrections | continuous |

Explicitly marking "we are at Stage 1 today" is deliberate — an honest maturity map is more credible than an inflated roadmap.

---

## Architecture

```
backend/                          Python + FastAPI
  app/
    main.py                       Route orchestration only — no business logic
    config.py                     DATA_SOURCE env var selects the data source
    data_sources/
      base.py                     TicketDataSource abstract interface (the core of the design)
      mock_source.py              Mock data source (current)
      real_source.py              Real data source (future — interface already defined)
    scoring/scorer.py             Rule engine; signature matches a future ML model
    storage/adjustment_log.py     Correction persistence — the single write path for labels
frontend/                         Next.js 16 + React 19 + Tailwind 4
  app/page.tsx                    Dashboard
  lib/i18n/                       Bilingual copy templates
```

Two deliberate extension points:

- **Swapping the data source touches no business logic.** `main.py` and `scorer.py` depend only on the `TicketDataSource` interface. Connecting real data means adding one file that implements it and flipping an env var — no other code changes.
- **Swapping the scoring logic touches no callers.** `score(features)` has a signature compatible with an sklearn model, so replacing it with `model.predict(...)` later is invisible to everything upstream.

### Current Scoring Rules

Priority 1 (low) – 4 (urgent); rule hits stack:

| Rule | Points |
|---|---|
| Matches one keyword group (billing / login / refund) | +1 |
| Matches two or more keyword groups | +1 more |
| Customer is on a Pro / Enterprise plan | +1 |
| Same customer filed ≥2 tickets in the last 30 days | +1 |

### API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/tickets` | Scored tickets, sorted by priority |
| POST | `/api/tickets/{id}/confirm` | Accept the system's suggestion |
| POST | `/api/tickets/{id}/adjust` | Override the priority manually |
| GET | `/api/stats` | Processed / pending counts, average handling time |
| GET | `/api/adjustments` | Export all human correction records |

---

## Running Locally

**Backend** (defaults to http://localhost:8000)

```bash
cd backend
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt  # macOS/Linux
cp .env.example .env
./.venv/Scripts/python.exe -m uvicorn app.main:app --port 8000 --reload
```

**Frontend** (defaults to http://localhost:3000)

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Both `.env.example` files document what each variable does. Interactive API docs are at http://localhost:8000/docs.

> Note: source code comments and the backend README are written in Chinese — this is the author's working language.

---

## Further Reading

- [PriorAI_Portfolio_Case_Study.md](PriorAI_Portfolio_Case_Study.md) — full case study in both English and Chinese: business problem, target user, why not ML first, human-in-the-loop design
- [backend/README.md](backend/README.md) — backend architecture details and the concrete steps for connecting real data
- [README.zh-CN.md](README.zh-CN.md) — 中文版
