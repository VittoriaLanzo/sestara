## What

Adds runtime parameter validation to the Python SDK so that users receive a clear, actionable `UserWarning` — instead of a cryptic HTTP error — when they pass a wrong type to `trace()`, `LangWatchTrace`, or `LangWatchSpan`. Fixes #26.

## Why

Python's optional type hints are not enforced at runtime. A common mistake is:

```python
# Wrong – labels should be a list
trace.update(metadata={"labels": "production"})

# Wrong – contexts should be a list, not a single dict
span.update(contexts={"document_id": "doc-1", "content": "..."})
```

Before this change, the error only surfaced at the HTTP endpoint with an unhelpful message. After this change, the user sees a warning immediately at the call site, the malformed value is silently dropped, and the application keeps running without interruption.

## How

A new `langwatch/utils/validation.py` module provides two pure helper functions:

- `validate_list_param(param_name, value, example)` — warns and returns `None` when `value` is not a `list`
- `validate_metadata(value)` — warns and returns `None` when `value` is not a `dict`; additionally strips the `labels` key and warns if its value is not a list

Both helpers use `warnings.warn(UserWarning)` so the SDK never raises an exception that could interrupt a user's application. On bad input they return `None`, which the callers treat as "not provided" — preventing malformed data from reaching the HTTP endpoint.

Validation is applied at the earliest possible entry points:
- `LangWatchTrace.__init__()` — covers the `@langwatch.trace()` decorator and the context-manager pattern
- `LangWatchTrace.update()` — covers later metadata/context updates
- `LangWatchSpan.update()` — covers all span writes, since every span code path funnels through this method

## Testing

- [ ] All existing tests pass (`pytest tests/ -m "not e2e"`)
- [ ] New tests added for:
  - `tests/utils/test_validation.py` — 15 unit tests covering both helpers (happy path, wrong type, edge cases, warning content)
  - `tests/telemetry/test_param_validation.py` — 12 integration tests verifying the warning is raised in each entry-point context (trace init, trace update, span update)
- [ ] Tested manually by constructing traces with intentionally wrong parameter types and confirming the warning text, location, and that the application does not crash
