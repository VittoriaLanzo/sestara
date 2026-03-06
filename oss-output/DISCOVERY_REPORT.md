# OSS Contribution Discovery Report

## Search Queries Run

All 8 search queries from the prompt were executed via the GitHub REST API.

---

## Candidate Repos Scored

| Repo | Stars | Updated | Tier | Issues | Score |
|------|-------|---------|------|--------|-------|
| langwatch/langwatch | 3,041 | 2026-03-06 | A (LLM eval) | 317 open | **13** |
| lukevella/rallly | 4,991 | 2026-03-06 | B (i18next/TypeScript) | 23 open | **11** |
| wasp-lang/open-saas | 13,485 | 2026-03-05 | B (Supabase/TypeScript) | 20+ open | **9** |
| satnaing/shadcn-admin | 11,337 | 2026-02-11 | B (shadcn/TypeScript) | 16 open | **7** |
| confident-ai/deepeval | 13,955 | 2026-03-05 | A (LLM eval) | 243 open | **6** |

### Scoring Details

**langwatch/langwatch (Score: 13)**
- Has open `good first issue` labeled: #26 "Raise a runtime error if Python sdk parameters are passed wrong" (+3)
- Last commit: 2026-03-06 (today) (+3)
- Stars: 3,041 (100–10,000 range) (+2)
- Has CONTRIBUTING.md (size: 3,347 bytes) (+2)
- Tier A — LLM evaluation & observability (+2)
- Rich CI/CD: 28+ workflows including sdk-python-ci, e2e-ci, langwatch-app-ci (+1)

**lukevella/rallly (Score: 11)**
- Has `good first issue` label on #641 "Add support for email service providers APIs" (+3)
- Last commit: 2026-03-06 (today) (+3)
- Stars: 4,991 (+2)
- Has CONTRIBUTING.md (+2)
- Tier B — uses i18next (Vittoria's stack) (+2, partial: no direct i18n issue)
- CI workflow present (+1, partial)

**wasp-lang/open-saas (Score: 9)**
- Has `good first issue` labels (+3)
- Active (updated 2026-03-05) (+3)
- Stars: 13,485 (slightly above 10k range, -1 on visibility weight)
- Has CONTRIBUTING.md (+2)
- Tier B — Supabase/TypeScript (+2, partial)
- CI present (+1)

**Deselected repos:**
- `satnaing/shadcn-admin`: No labels on open issues, stalled maintenance
- `confident-ai/deepeval`: 0 good-first-issue labels, large codebase, stars >10k

---

## Top 3 Selected Repos & Issues

### 1. langwatch/langwatch — Issue #26
"Raise a runtime error if Python sdk parameters are passed wrong"
- Python SDK, labels good-first-issue
- Direct match: Python typing validation, LLM observability domain

### 2. lukevella/rallly — Issue #641
"Add support for email service providers APIs as an alternative to SMTP"
- TypeScript, good first issue
- Mailgun transport needs to be added

### 3. wasp-lang/open-saas — Issue #583
"Backticks on Roadmap on landing page are messed up"
- TypeScript/React, good first issue
- Simple UI text rendering fix

---

## Selected Contribution

**langwatch/langwatch — Issue #26**

Reasoning: Highest combined (impact × feasibility):
- Vittoria's research domain (LLM evaluation/observability)
- Python is in her primary stack
- Clear, well-scoped issue with a specific requested behavior
- No existing open PR (verified via API)
- Directly builds credibility in LLM tooling space
