# Modal to Daytona

Start with the [migration overview](README.md) and its
[reviewed toolkit checkout](README.md#toolkit-checkout). In that checkout, read
`modal/README.md` and `modal/skills/migrate-modal-rlp/SKILL.md`.

```sh
node "$MIGRATION_TOOLKIT/linters/cli.mjs" /path/to/app --from modal
node "$MIGRATION_TOOLKIT/linters/cli.mjs" /path/to/app --from modal --format json
```

Use the text command for human review and JSON for the
[agent loop](README.md#agent-workflow). Coverage includes Python sandbox calls
and the [Modal JavaScript client](https://modal.com/docs/sdk/js/latest/ModalClient),
with review findings for images, secrets, volumes and unsupported services.

Separate sandbox execution from Modal Functions, decorators, queues, schedules
and autoscaling. Image declarations require a reviewed target build recipe;
do not execute application definitions merely to discover configuration.
Preserve explicit stream reads, file open modes, tunnel authorization and
the caller's sync/async context. Source image and snapshot IDs are not reusable
Daytona IDs.

<!-- RLP target sources: clients/typescript/src/v2/Image.ts;
clients/typescript/src/v2/Images.ts; clients/typescript/src/v2/index.ts;
clients/python/src/daytona/v2/__init__.py. -->
Public v2 Functions, volumes, GPU/Windows creation and persistent Linux
creation are **not yet available** at the audited pin. A long-running sandbox
does not supply a serverless scheduler or durable-volume contract. Keep
required services or block that part of the migration.

Apply supported findings, test results/streams/state and re-lint. Run a live
comparison only with the applicable authorization and an explicit cleanup plan.
