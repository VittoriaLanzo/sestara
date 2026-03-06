# Contribution Plan: langwatch/langwatch #26

## Issue Summary

The LangWatch Python SDK accepts parameters typed as lists (e.g. `contexts`, `evaluations`) and dicts (e.g. `metadata`) without runtime validation. When a user passes `metadata={"labels": "my-label"}` instead of `metadata={"labels": ["my-label"]}`, the error only surfaces at the HTTP endpoint — far from the call site and hard to debug.

## Why This PR Matters for Vittoria's Profile

Demonstrates Python SDK engineering judgment (type safety, defensive API design) inside an actively-maintained LLM observability platform — directly relevant to LLM research tooling credibility for the UniBO paper and Sestara product work.

## Scope

- Files to modify:
  - `python-sdk/src/langwatch/telemetry/tracing.py` — validate `metadata`, `contexts`, `evaluations` in `__init__` and `update()`
  - `python-sdk/src/langwatch/telemetry/span.py` — validate `contexts` in `update()`
- Files to create:
  - `python-sdk/src/langwatch/utils/validation.py` — shared validation helpers
  - `python-sdk/tests/utils/test_validation.py` — unit tests for helpers
  - `python-sdk/tests/telemetry/test_param_validation.py` — integration tests for trace/span behavior
- Estimated diff size: **M** (~120 lines added, ~5 lines modified)

## Approach

A standalone `validation.py` module in `utils/` provides two pure functions: `validate_list_param` and `validate_metadata`. Both emit `warnings.warn(UserWarning)` with a clear message including the parameter name, received type, and a corrected example. On bad input, they return `None` so the downstream code never receives a malformed value — satisfying the issue's requirement to "bail from sending malformed data" without raising an exception that could break user applications.

The validation is applied at the entry point of both `LangWatchTrace.__init__()` and `LangWatchTrace.update()`, and at `LangWatchSpan.update()`. This ensures every code path (decorator, context manager, and manual update) is covered. The `stacklevel` of warnings is tuned so the warning points at the user's call site, not inside the SDK.

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| PR touches hot path in `update()` | Validation is purely additive (no behavior change on valid inputs); all existing tests must still pass |
| Over-broad validation breaks valid dict subclasses for metadata | Use `isinstance(value, dict)` which passes for OrderedDict, TypedDict, Pydantic models converted to dict |
| stacklevel miscalculation causes confusing warning location | Unit tests assert the warning `filename` points to the test file, not the SDK internals |
| Missing validation on the `span()` decorator path | `span.update()` is the single funnel for all attribute writes — covering it covers all paths |

## Acceptance Criteria

1. `LangWatchTrace(metadata="bad")` emits a `UserWarning` containing `"metadata"` and does not store the invalid value
2. `trace.update(contexts={"content": "chunk"})` (dict instead of list) emits a `UserWarning` containing `"contexts"`
3. `trace.update(evaluations={"name": "eval"})` (dict instead of list) emits a `UserWarning` containing `"evaluations"`
4. `span.update(contexts="raw string")` (str instead of list) emits a `UserWarning` containing `"contexts"`
5. All existing tests pass (`pytest tests/ -m "not e2e"`)
6. New tests achieve 100% branch coverage of `validation.py`
7. Ruff linter passes with 0 warnings
