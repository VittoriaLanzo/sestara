# OSS Contribution PRs

All contributions are original work submitted to permissive-licensed (MIT / Apache 2.0)
open-source repositories. No competing PRs existed at time of submission.

---

## 1. langwatch/langwatch #2033 — Python SDK parameter validation
**Repo:** 3k ⭐ | MIT | LLM observability
**Issue:** [#26](https://github.com/langwatch/langwatch/issues/26) — Raise runtime error/warning when Python SDK parameters are passed with wrong types
**PR:** https://github.com/langwatch/langwatch/pull/2033
**What:** Added `validate_list_param` + `validate_metadata` helpers; patched `trace()` and `span()` to call them; 31 tests.

---

## 2. prefecthq/prefect #21004 — --no-create-pool-if-not-found CLI flag
**Repo:** 21k ⭐ | Apache 2.0 | Workflow orchestration
**Issue:** [#20980](https://github.com/PrefectHQ/prefect/issues/20980) — Disable automatic work pool creation
**PR:** https://github.com/PrefectHQ/prefect/pull/21004
**What:** Exposed the existing `BaseWorker.create_pool_if_not_found` kwarg as a `--create-pool-if-not-found / --no-create-pool-if-not-found` flag on `prefect worker start`, so IaC-managed pools aren't silently re-created.

---

## 3. pola-rs/polars #26828 — from_repr DST ambiguity fix
**Repo:** 37k ⭐ | MIT | Fast DataFrame library
**Issue:** [#26797](https://github.com/pola-rs/polars/issues/26797) — `pl.from_repr()` crashes on DST-transition timestamps even when abbreviation is unambiguous
**PR:** https://github.com/pola-rs/polars/pull/26828
**What:** Fixed `_cast_repr_strings_with_schema` to extract the timezone abbreviation before stripping it, classify it as DST vs standard time, and pass a per-row `ambiguous` expression to `replace_time_zone` so `from_repr` round-trips correctly for all tz-aware datetime columns.

---

## 4. langfuse/langfuse #12436 — TTFT value on trace timeline
**Repo:** 22k ⭐ | MIT | LLM observability / tracing
**Issue:** [#3517](https://github.com/langfuse/langfuse/issues/3517) — Visualize time-to-first-token in trace timeline view
**PR:** https://github.com/langfuse/langfuse/pull/12436
**What:** Added `timeToFirstToken` to `TimelineMetrics`, computed it during tree-flattening, and rendered the formatted value inside the waiting-period segment of the split bar for streaming LLM spans.
