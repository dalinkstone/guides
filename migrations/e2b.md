# E2B to Daytona

Start with the [migration overview](README.md) and its
[reviewed toolkit checkout](README.md#toolkit-checkout). In that checkout, read
`e2b/README.md` and `e2b/skills/migrate-e2b-rlp/SKILL.md`.

```sh
node "$MIGRATION_TOOLKIT/linters/cli.mjs" /path/to/app --from e2b
node "$MIGRATION_TOOLKIT/linters/cli.mjs" /path/to/app --from e2b --format json
```

Use text for human review and JSON for the [agent loop](README.md#agent-workflow).
Both TS/JS and Python sandbox/code-interpreter imports are covered. Check the
application's [E2B SDK](https://e2b.dev/docs) version and preserve sync/async
context when applying findings.

Map templates to reviewed images/build recipes rather than passing E2B template
IDs to Daytona. Separate create from reconnect, command execution from
interpreter cells, and process deadlines from sandbox lifetime. Compare rich
results, errors, stdout/stderr and kernel state explicitly; matching a final
string is not enough. Preserve file bytes, preview authorization and owned IDs.

<!-- RLP target sources: clients/typescript/src/v2/Daytona.ts;
clients/typescript/src/v2/Interpreter.ts; clients/typescript/src/v2/Process.ts;
clients/typescript/src/v2/Sandbox.ts; clients/typescript/src/v2/index.ts. -->
Pause, snapshot and restoration semantics need a state-retention design.
Public v2 volumes and persistent Linux creation are **not yet available** at
the audited pin. Do not convert a pause into deletion or assume a source
snapshot identifier can restore target state.

Apply supported findings, run application acceptance tests and re-lint. A
clean scan is a static checkpoint; verify recovery and cleanup before an
authorized cutover.
