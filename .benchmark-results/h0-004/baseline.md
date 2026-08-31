# H0-004 Baseline Capture

Capture schema version: 1
Captured at: 2026-08-31T01:07:14.759Z
Harness git revision: 2664cb9d46eaa79e2bbece570ed78cba722129ef
Harness package version: 0.1.0-alpha.7

## Runtime

Role | Provider | Model
--- | --- | ---
planner | nvidia | nvidia/nemotron-3.5-lightning-30b-a3b
reviewer | nvidia | openai/gpt-oss-20b
refiner | nvidia | nvidia/nemotron-3.5-lightning-30b-a3b

## Fixtures

Benchmark | Repository | Revision | Commit | Historical source revision
--- | --- | --- | --- | ---
B01 | fixture-simple-api | b01-v1 | e4eec8d1560ed76c027581da72f224ca1ad98632 | n/a
B02 | fixture-health-already-present | b02-v1 | 756c2105d32e2bbc70b5991e3c5fca51f495a908 | n/a
B03 | fixture-component-app | b03-v1 | dc7c900578323848c9039962b643bb3cc9f052ba | n/a
B04 | qflow-workflow-canvas | b04-v1 | 8e3d67d789fd12484206eade90a021300997f241 | 986051f70be5ea06323d4dd508a5465b797a5396
B05 | qos-harness-architecture | b05-v1 | f2c541714e125e01fc77ef6a1fb331cde2a96194 | 4329623bb82bda660c245074739617e662ff3b68

---

# H0-004 Benchmark Comparison Report

Schema version: 1

## Suite Summary

- Selected tasks: 5
- Completed tasks: 3
- Infrastructure failures: 2
- Accepted tasks: 3
- SFCR: 60.00%
- Outcome correctness: 60.00%
- Validation success: 60.00%
- Human intervention: 0.00%
- Total Harness duration (ms): 128479
- Average Harness duration (ms): 42826.333333333336
- Total LLM calls: 16
- Average LLM calls per completed task: 5.333333333333333
- Prompt tokens: 15033
- Completion tokens: 2261
- Total tokens: 17294
- Cost: n/a

## Tasks

Benchmark | Status | Expected | Observed | Accepted | Validation | Human intervention | Duration ms | LLM calls | Failure
--- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---
B01 | completed | changes_required | changes_required | true | true | false | 24870 | 5 | n/a
B02 | completed | already_satisfied | already_satisfied | true | true | false | 34688 | 6 | n/a
B03 | completed | changes_required | changes_required | true | true | false | 68921 | 5 | n/a
B04 | infrastructure_failed | n/a | n/a | n/a | n/a | n/a | n/a | n/a | BenchmarkObservationDerivationError: Cannot derive benchmark outcome without refinedPlan.
B05 | infrastructure_failed | n/a | n/a | n/a | n/a | n/a | n/a | n/a | BenchmarkObservationDerivationError: Cannot derive benchmark outcome without refinedPlan.

## Terminal Failure Reasons

None

## Infrastructure Failure Reasons

- BenchmarkObservationDerivationError: 2
