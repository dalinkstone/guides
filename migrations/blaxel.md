# Blaxel to Daytona

Start with the [migration overview](README.md) and its
[reviewed toolkit checkout](README.md#toolkit-checkout). In that checkout, read
`blaxel/README.md` and `blaxel/skills/migrate-blaxel-rlp/SKILL.md`.

```sh
node "$MIGRATION_TOOLKIT/linters/cli.mjs" /path/to/app --from blaxel
node "$MIGRATION_TOOLKIT/linters/cli.mjs" /path/to/app --from blaxel --format json
```

The first command supports human review; the second feeds the
[agent loop](README.md#agent-workflow). Both scan TS/JS and Python sandbox
imports, construction, processes, files, previews, lifecycle and options.
Check findings against the installed [Blaxel SDK](https://docs.blaxel.ai/)
before applying them.

Preserve named-sandbox ownership, reconnect behavior, command streams,
preview authorization and cleanup. A retrieved sandbox is not newly owned
merely because a new client object was created. Jobs, agent hosting, model
gateways and platform authentication need separate migration plans.

<!-- RLP target sources: clients/typescript/src/v2/Daytona.ts;
clients/typescript/src/v2/Ports.ts; clients/typescript/src/v2/index.ts. -->
Public v2 volumes, persistent Linux creation and Functions are **not yet
available** at the audited pin. Storage or orchestration requirements that
depend on them must stay on the source platform or block cutover. Do not
silently widen preview access or forward source credentials into the guest.

Apply supported findings, run offline acceptance tests and re-lint. Historical
Blaxel trial reports are not evidence that the current application works on v2.
