# Cloudflare Sandbox to Daytona

Start with the [migration overview](README.md) and its
[reviewed toolkit checkout](README.md#toolkit-checkout). In that checkout, read
`cloudflare/README.md` and `cloudflare/skills/migrate-cloudflare-rlp/SKILL.md`.

```sh
node "$MIGRATION_TOOLKIT/linters/cli.mjs" /path/to/app --from cloudflare
node "$MIGRATION_TOOLKIT/linters/cli.mjs" /path/to/app --from cloudflare --format json
```

Use text for human review and JSON for the [agent loop](README.md#agent-workflow).
Match the source SDK version to the application. TypeScript coverage includes
`@cloudflare/sandbox` calls; native 1.x Container methods and their Worker
context require manual review. Python coverage is explicitly the documented
[Sandbox SDK 0.x HTTP bridge](https://developers.cloudflare.com/sandbox/sdk/bridge/http-api/),
not a Python Sandbox SDK. Use `--from cloudflare` for that bridge because its
hostname is user-owned and cannot identify the provider automatically.

Keep Workers, Durable Objects, ingress auth, storage bindings, routing and
control logic separate from the guest execution plane. Preserve bridge stream
encoding, file transfer direction and session state. Moving command execution
does not move the Worker or its edge bindings.

<!-- RLP target sources: clients/typescript/src/v2/Process.ts;
clients/typescript/src/v2/FileSystem.ts; clients/typescript/src/v2/index.ts;
clients/cli/cmd/volume.go. -->
Public v2 volumes and persistent Linux creation are **not yet available** at
the audited pin. R2 mounts and saved workspaces require an explicit storage
plan. Do not replace persistence with ephemeral files or drop source auth to
make preview access work.

Apply supported findings, test the edge-to-guest boundary and re-lint. Static
results cannot establish parity for the full Cloudflare application.
