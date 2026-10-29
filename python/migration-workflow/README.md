# Verify a migrated sandbox workflow (Python)

Run one disposable Daytona v2 workflow: create a sandbox, write a file, run a command, read the result and delete the owned sandbox. Use this as the target-side acceptance example when migrating sandbox execution from Vercel, Fly Machines, Blaxel, Modal, Cloudflare or E2B.

This example does not translate hosting, volumes, Functions, edge bindings or source images. Compare those requirements separately before moving an application.

## Requirements

- Python 3.10+ and `daytona==2.0.0a3`.
- Organization access to Daytona v2 Linux sandboxes.
- A Daytona API key and an approved registered image containing `python3`.

The default SDK release channel can select stable 0.x. Keep the exact dependency pin. Use the [v2 client reference](https://www.daytona.io/docs/en/v2/python-sdk/daytona/).

## Check offline

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
python -m unittest -v
```

These checks verify SDK compatibility and the acceptance logic without credentials. They reject failed commands and changed file contents, and check cleanup of the owned sandbox. They do not prove live deployment behavior.

## Run a live check

This step creates a billable sandbox and deletes only that new sandbox. It does not access or delete source-provider resources.

Export `DAYTONA_API_KEY` through your usual secret-management mechanism. Export `DAYTONA_IMAGE` with the registered image name or ID. The script does not load `.env` automatically; `.env.example` lists the required names only.

```sh
python workflow.py --run
```

Expect JSON containing `"output": "migration ok\n"` and a zero exit code. The sandbox ID goes to stderr for recovery. The script rejects an unsuccessful process result or a changed file.

Creation waits up to 60 seconds, then an explicit startup wait allows up to 300 additional seconds. Guest operations begin only after the sandbox reaches `started`; a startup failure still triggers cleanup.

The process execution deadline is 30 seconds. The example requests deletion after a 600-second sandbox lifetime as a fallback. Normal cleanup deletes the sandbox in `finally`. A failed or uncertain create can require manual inspection; do not blindly create another resource. If cleanup fails, use the printed owned ID to inspect it. See [lifecycle behavior](https://www.daytona.io/docs/en/v2/python-sdk/sandbox/).

## Apply it to a migration

1. Inventory the source application's commands, arguments, working directory, file bytes, identity, auth and deadlines.
2. Run the reviewed migration linter against that application. Treat its snippets as examples, not automatic edits.
3. Adapt the application while preserving those requirements. Source IDs and snapshots are not portable.
4. Add acceptance checks for the application's actual outputs, failure cases, previews and recovery.
5. Re-lint and run offline tests. Authorize a live check separately before changing production traffic.
6. Keep the source service available until the migrated workflow passes its acceptance checks.

For async Python applications, use `AsyncDaytona` and await the matching operations; this Python example does not establish parity for every source runtime. Review [persistence](https://www.daytona.io/docs/en/v2/persistence/) and [volume availability](https://www.daytona.io/docs/en/v2/volumes/) before moving durable state.

Validation recorded for this change: offline SDK and acceptance checks only. No live sandbox was created to verify this example.

