# Fly Machines to Daytona

Start with the [migration overview](README.md) and its
[reviewed toolkit checkout](README.md#toolkit-checkout). In that checkout, read
`fly/README.md` and `fly/skills/migrate-fly-rlp/SKILL.md`.

```sh
node "$MIGRATION_TOOLKIT/linters/cli.mjs" /path/to/app --from fly
node "$MIGRATION_TOOLKIT/linters/cli.mjs" /path/to/app --from fly --format json
```

The first command is for humans; the second feeds the
[agent loop](README.md#agent-workflow). TS/JS and Python coverage recognizes
[Machines REST](https://docs.fly.io/machines/api/) endpoint calls and statically
visible payloads. It does not invent a Fly SDK for either language. Route IDs
and HTTP verbs matter; uncertain operations receive blocking review.

Inventory each Machine's image, app ownership, service ports, env, deadlines
and attached data. Keep Fly Proxy routing, private networking, service discovery,
app secrets and volume responsibilities explicit. A running process in a
sandbox does not replace an application's global routing or scaling policy.
Sprites and automatic `fly.toml` conversion are outside this linter's scope.

<!-- RLP target sources: clients/typescript/src/v2/Daytona.ts;
clients/typescript/src/v2/types.ts; clients/typescript/src/v2/index.ts;
clients/cli/cmd/volume.go. -->
Public v2 volumes and persistent Linux creation are **not yet available** at
the audited pin. Retain required source storage or block migration; never
replace a Machine stop with deletion to satisfy a linter. Review CPU guarantee
versus burst ceilings and resource units using the toolkit API map.

Apply supported findings, test behavior and re-lint. Dynamic request wrappers
and network topology still need manual review before authorized cutover.
