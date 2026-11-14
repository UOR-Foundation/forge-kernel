# Backlog workflow reconciliation

The combined application stack preserves the full immutable-SDK acceptance boundary and all existing browser and performance checks. No thresholds, CSP, or universal policy files are relaxed.

The Pages cache key now includes the stateful engine inputs in `v2/shell`, `v2/loop`, and `v2/probe-payment/data`, `v2/probe-payment/src`, and `v2/hosted-check`, because the current renderer imports those sources. Unconsumed prototypes remain excluded. Performance workflow path filters cover the same inputs. Cache misses stage the locked compiler and renderer before projecting and auditing the complete shell closure. Browser acceptance uses the renderer's locked Playwright package and invokes the replay script with Bash.

Independent review identified the additional hosted-check and browser-model source inputs; the input coverage control now derives its source list directly from the engine projector rather than a hand-maintained subset.

Four controls in `studio/tools/backlog_workflows.test.mjs` verify input identity, locked browser selection, staging order with cache-miss guards, and the complete browser command inventory with failure aggregation and verified prerequisites. Omitting `v2/loop/**` from the reuse key fails the intended assertion, `reuse omits v2/loop/**`. Restoring it passes. All four controls run through both the Studio workflow and FA-24's complete conformance invocation: 33 tests, 33 passes, no skipped or filtered controls.

These local results qualify the inspected workflow reconciliation only. Fresh combined-tree SDK, kernel construction and identity replay, full Studio/browser runs, and both performance lanes remain required before merge.


## Reviewed browser inventory repair (2026-11-14)

Historical motivation: at main `6d8021ff583873fb51abcc4bdd5c8ec2d84ee06a`,
#193 added `run node tools/plain_chat_layout_browser.mjs`. The fourth workflow
control still expected 64 commands. The complete FA-24 Node invocation
reproduced 33 tests, 32 passes and one failure: `mandatory command count changed
for Verify snapshot rollback in browser storage` (`65 !== 64`).

Main then advanced to `16bf8c161a46df2755fcd139aedef237b5b15484` through #199,
reverting #193 after its real preview-auto-start browser gate failed. This
repair incorporates that main revision and keeps the rollback intact. Its
prior 65-command inventory correctly rejected the newly removed command
(three workflow controls passed, one failed) before reconciliation.

The current control pins nine host-scope and 64 storage/browser commands in
reviewed order, including interpreters and arguments. It checks uniqueness and
exact equality, rather than only count or deriving the expectation from the
workflow under test. Intended additions must update the reviewed inventory.
Workflow commands, guards and failure aggregation are identical to current
main. The four top-level workflow tests and FA-24's exact 33-control requirement
are unchanged. Relative to that main revision, only this record and the workflow
test change; no rolled-back layout, product, model, SDK, kernel or identity
changes are restored.

Negative controls remove and substitute each command, and reject unreviewed
additions, same-count duplicate replacements and reordering. Full-workflow
mutations remove, replace or conditionally skip the retained
`preview_auto_start_browser.mjs` command and fail on inventory mismatch or
omitted execution. Existing fail-open, fail-fast and missing-prerequisite
mutations remain active. A separate temporary test copy restoring count-only
equality fails with `Missing expected exception` on an unreviewed same-count
substitution. Mutated copies are not retained.

Restored local results on Node 24.22.1:

- `node --test studio/tools/backlog_workflows.test.mjs`: 4/4 passed.
- `node --test --test-reporter=tap studio/tools/current_main_integration.test.mjs studio/tools/rules_transaction.test.mjs studio/tools/main_stateful_integration.test.mjs studio/tools/notation_host_integration.test.mjs studio/tools/backlog_workflows.test.mjs`: 33/33 passed, zero failures, cancellations, skips or todos.
- The affected Studio step, `node --test tools/notation_host_integration.test.mjs tools/backlog_workflows.test.mjs tools/application_shape_authority.test.mjs tools/proof_approval_cancellation.test.mjs` from `studio/`: 33/33 passed, zero failures, cancellations, skips or todos.
- `node --check studio/tools/backlog_workflows.test.mjs` and `git diff --check`: passed.

These focused host-tool checks are not full release acceptance. Docker, Cargo
and Just are unavailable here, so locked-SDK `just vv`, the Rust wrapper and
the real browser lane have not run locally. Exact-head CI on the reconciled
candidate remains required before readiness or merge; earlier-head results
cannot qualify this reconciliation.
