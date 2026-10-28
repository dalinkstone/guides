# Vercel Sandbox to Daytona

Start with the [migration overview](README.md) and its
[reviewed toolkit checkout](README.md#toolkit-checkout). In that checkout, read
`vercel/README.md` and `vercel/skills/migrate-vercel-rlp/SKILL.md`.

```sh
node "$MIGRATION_TOOLKIT/linters/cli.mjs" /path/to/app --from vercel
node "$MIGRATION_TOOLKIT/linters/cli.mjs" /path/to/app --from vercel --format json
```

The first command is for human review; the second feeds the
[agent loop](README.md#agent-workflow). Both scan TypeScript/JavaScript and
Python. Review imports, create/reconnect, commands, files, env, previews,
timeouts, lifecycle and persistence findings as one workflow.

Record the installed [Vercel Sandbox SDK](https://vercel.com/docs/sandbox/sdk-reference)
version before changing code: persistent defaults and stop behavior differ
across versions. Map an owned Vercel sandbox ID to a Daytona ID explicitly.
Keep hosting, Next.js deployment, OIDC and application authorization separate
from sandbox execution. Preserve command arguments, cwd, file bytes and preview
access. A stop operation must not silently become deletion.

<!-- RLP target sources: clients/typescript/src/v2/Daytona.ts;
clients/typescript/src/v2/Sandbox.ts; clients/typescript/src/v2/index.ts. -->
Durable drive/volume assumptions and persistent Linux creation are blocked
while their public v2 replacements are **not yet available**. Snapshots and
source image identifiers are not portable artifacts. The toolkit's preserved
SDK 0.226.1 Vercel adapter has a separate bounded contract; do not use its old
validation report as evidence for v2.

Apply supported findings, test behavior, re-lint, and retain explicit blockers
before scheduling a separately authorized cutover.
