# Commands to apply test fixes to VittoriaLanzo/prefect PR #21004

## Context

PR #21004 on PrefectHQ/prefect adds a `--create-pool-if-not-found / --no-create-pool-if-not-found`
CLI flag to `prefect worker start`. CI was failing because:
1. Six existing tests that assert on `worker_cls(...)` constructor kwargs were missing `create_pool_if_not_found=True`
2. No tests exercised the new flag

## Changes Made

### `tests/cli/test_worker.py`

Six existing tests updated — `create_pool_if_not_found=True` added to each
`mock_worker.assert_called_once_with(...)` call:

- `test_start_worker_with_work_queue_names`
- `test_start_worker_with_specified_work_queues_paused`
- `test_start_worker_with_all_work_queues_paused`
- `test_start_worker_with_prefetch_seconds`
- `test_start_worker_with_prefetch_seconds_from_setting_by_default`
- `test_start_worker_with_limit`

Two new tests added:

- `test_start_worker_create_pool_if_not_found_default` — verifies default `True`
- `test_start_worker_no_create_pool_if_not_found` — verifies `--no-create-pool-if-not-found` passes `False`

## Apply the fixes

```bash
# Navigate to your local clone of VittoriaLanzo/prefect
cd /path/to/prefect

# Switch to the PR branch
git checkout fix/20980-no-create-pool-if-not-found

# Copy the corrected test file
cp /path/to/sestara/oss-output/code/prefect/tests/cli/test_worker.py \
   tests/cli/test_worker.py

# Commit and push
git add tests/cli/test_worker.py
git commit -m "test(worker): update assertions for create_pool_if_not_found flag

- Add create_pool_if_not_found=True to all existing mock_worker.assert_called_once_with() calls
- Add test_start_worker_create_pool_if_not_found_default to verify default True behavior
- Add test_start_worker_no_create_pool_if_not_found to verify --no-create-pool-if-not-found passes False

Closes CI failures reported by @desertaxle."

git push origin fix/20980-no-create-pool-if-not-found
```

## Verify locally (requires Prefect dev environment)

```bash
python -m pytest tests/cli/test_worker.py -x -v
```
