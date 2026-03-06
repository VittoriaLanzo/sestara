# Commands to submit the contribution to langwatch/langwatch

## 1. Fork & clone

```bash
gh repo fork langwatch/langwatch --clone
cd langwatch
```

## 2. Branch

```bash
git checkout -b fix/26-runtime-param-validation
```

## 3. Apply changes

Copy the four files from the `code/` directory in this output folder into the repo:

```bash
# New file
cp <output>/code/python-sdk/src/langwatch/utils/validation.py \
   python-sdk/src/langwatch/utils/validation.py

# Modified files (replaces originals)
cp <output>/code/python-sdk/src/langwatch/telemetry/span.py \
   python-sdk/src/langwatch/telemetry/span.py

cp <output>/code/python-sdk/src/langwatch/telemetry/tracing.py \
   python-sdk/src/langwatch/telemetry/tracing.py

# New test files
cp <output>/code/python-sdk/tests/utils/test_validation.py \
   python-sdk/tests/utils/test_validation.py

cp <output>/code/python-sdk/tests/telemetry/test_param_validation.py \
   python-sdk/tests/telemetry/test_param_validation.py
```

## 4. Verify

```bash
cd python-sdk

# Install dependencies (requires uv: https://github.com/astral-sh/uv)
uv sync

# Run unit + integration tests (skips E2E which needs API keys)
uv run pytest tests/ -m "not e2e" -v

# Lint
uv run ruff check src/ tests/

# Format check
uv run ruff format --check src/ tests/
```

## 5. Commit & push

```bash
cd ..  # back to repo root
git add python-sdk/src/langwatch/utils/validation.py \
        python-sdk/src/langwatch/telemetry/span.py \
        python-sdk/src/langwatch/telemetry/tracing.py \
        python-sdk/tests/utils/test_validation.py \
        python-sdk/tests/telemetry/test_param_validation.py

git commit -m "fix(python-sdk): warn on wrong parameter types in trace and span (#26)"

git push origin fix/26-runtime-param-validation
```

## 6. Open PR

```bash
gh pr create \
  --title "fix(python-sdk): warn on wrong parameter types in trace and span" \
  --body-file <output>/PR_DESCRIPTION.md \
  --base main
```

> **Note:** Before opening, check if the issue maintainer (@rogeriochaves) has
> any preferred approach by leaving a short comment on issue #26 confirming your
> intent. This repo's CONTRIBUTING.md recommends opening an issue before a PR
> for major changes. Since #26 already exists and is labeled `good first issue`,
> a PR is appropriate.
