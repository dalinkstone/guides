# Migrating to Daytona

Move one owned sandbox workflow at a time: inventory its behavior, run the
migration linter, adapt supported examples, and verify the result before cutover.
These guides target **Daytona v2 (alpha)**. Other examples in this repository
may target SDK 0.x; follow each example's dependency pin.

<!-- Target evidence: daytona/rlp@21dbcb18fd5e982b3ffe7aefe721e61ed2907145,
clients/typescript/src/Daytona.ts; clients/python/src/daytona/_client.py;
clients/typescript/src/v2/index.ts; clients/python/src/daytona/v2/__init__.py. -->
The audited v2 clients use the root `Daytona` client and its `.v2` namespace;
Python also provides `AsyncDaytona`. Use the toolkit's source-pinned API map
and an approved matching SDK release. Source version placeholders do not prove
that a registry release or deployment has the same surface. Consult the
[v2 SDK documentation](https://www.daytona.io/docs/en/v2/typescript-sdk/sandbox/)
and the toolkit's evidence when adapting code.

## Toolkit checkout

**Publication pending:** the toolkit does not yet have a confirmed repository
URL. This draft requires a reviewed checkout supplied by the maintainer. The
permanent toolkit source and per-provider links must be added before these
pages are treated as a generally available installation guide. Do not install
an unrelated package named `migrate-lint` from a registry.

The checkout contains a root README, `linters/AGENTS.md`,
`docs/daytona-api-map.md`, `docs/migration-workflow.md`, and one provider
directory for each source below. Its stable Vercel adapter is separately
documented in `vercel/STABLE-ADAPTER.md`; it is not a v2 adapter.

Requires Node 22.4+ and Python 3.10+. No cloud credentials are needed to lint.
For a checkout at `~/main/migrate`:

```sh
export MIGRATION_TOOLKIT="$HOME/main/migrate"
npm --prefix "$MIGRATION_TOOLKIT" ci --ignore-scripts
node "$MIGRATION_TOOLKIT/linters/cli.mjs" /path/to/app --from auto
```

A local package installation exposes the same executable as
`migrate-lint /path/to/app --from auto`. The checkout command avoids a global
install and runs the reviewed source directly.

## Human workflow

1. Select a [source guide](#source-guides) and record its installed SDK version,
   image dependencies, owned IDs, deadlines, data and auth requirements.
2. Run the text linter and review each operation and caveat. Findings contain
   file/line ranges, severity, source behavior, a same-language example or an
   explicit blocker, and immutable target source references.
3. Integrate supported examples into the application's own handles and values.
   Blocked snippets intentionally raise an error; they are not completed work.
4. Run application type checks and offline tests, then re-lint. Review wrappers
   and unscanned code manually. Obtain the applicable authorization for live
   smoke tests, data transfer and final resource cleanup.

```sh
node "$MIGRATION_TOOLKIT/linters/cli.mjs" /path/to/app --from vercel --lang auto
```

## Agent workflow

Start with the provider skill at
`<toolkit>/<provider>/skills/migrate-<provider>-rlp/SKILL.md` and the shared
`linters/AGENTS.md`, then collect JSON:

```sh
node "$MIGRATION_TOOLKIT/linters/cli.mjs" /path/to/app --from auto --format json > migration-findings.json
```

Example agent instruction:

```text
Run the reviewed toolkit's migrate-lint entry point with --format json first.
Read every finding's sourceBehavior, suggestion, caveats and sources.
Preserve ownership, auth, async context, deadlines, files and persistent state.
Apply supported suggestions, type-check, run offline tests, and re-lint.
Report blockers and excluded wrappers; do not remove behavior to obtain a clean scan.
Do not make unrequested cloud calls or delete source resources.
```

JSON uses `schemaVersion: 1`, `filesScanned`, `findings`, `skipped`, `fixes` and
`limitations`. A suggestion has `kind: example` or `kind: blocked`; examples
are parameterized helpers, not automatic replacements. Exit codes are 0 for
no findings, 1 for findings, and 2 for usage/parse/infrastructure failure.
`--fix` currently makes no edits. A zero-file scan is not migration success.

## Source guides

| Source | Scope |
| --- | --- |
| [Vercel Sandbox](vercel.md) | Sandbox SDKs; retain hosting and application auth |
| [Fly Machines](fly.md) | Machines REST in TS/JS and Python |
| [Blaxel](blaxel.md) | Sandbox calls; separate jobs, agents and model gateways |
| [Modal](modal.md) | Sandbox workflows; Functions/autoscaling need another design |
| [Cloudflare](cloudflare.md) | Worker SDK and explicit Python 0.x bridge coverage |
| [E2B](e2b.md) | Sandbox/code execution; map templates and state explicitly |

## Known gaps and verification

<!-- Hidden-feature evidence at the target pin:
clients/typescript/src/v2/index.ts; clients/typescript/src/v2/Daytona.ts;
clients/python/src/daytona/v2/__init__.py; clients/cli/cmd/sandbox_create.go;
clients/cli/cmd/volume.go. -->
Volumes, persistent Linux creation, Functions, and GPU/Windows creation are
**not yet available** through the audited public v2 surface. A hidden flag or
internal handler is not a supported replacement. Keep required source services
or block the affected migration.

Static analysis does not prove runtime parity, cross-file wrapper behavior,
data migration or deployment availability. The toolkit validates its examples
against pinned SDK source offline; it has not run a live migration of your
application. Test command results, streams, file integrity, timeouts, recovery,
preview authorization and state retention before cutover. Config conversion,
image translation, cloud smoke execution and cost estimation remain proposals.
