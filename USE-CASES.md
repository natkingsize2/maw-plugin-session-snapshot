# Use Cases · maw-session-snapshot

## Why this exists

A brain orchestrator session ends in three ways: it runs out of context (~70%
the usual trigger), it hits a milestone worth marking, or it wraps with a
retrospective. Each ending needs the same three writes — `hot-write brain`
(supersedes the canonical [HOT] entry), `log-session-write` (append-only
session log), and Oracle `jod` (searchable entry via `do-rag learn`) — and
each one is easy to forget under context pressure. Forgetting any of the
three breaks the "Session Start Protocol" of the *next* session: brain wakes
up with no idea what it was doing. `maw snapshot` is the one command that
guarantees all three writes happen together, with auto-detected git + tmux
+ Oracle context.

## Who benefits

- **Brain orchestrators** — one command before `/clear`, no chance of writing one log and skipping another
- **Worker agents (nicky, vicky, micky)** — drop `maw snapshot --milestone "T#42 done"` into a callback hook and the milestone is durably captured
- **RRR rituals** — `--rrr` stamps a retrospective with the standard `[RRR-YYYY-MM-DD]` tag so it surfaces in Oracle search next to its siblings
- **Anyone resuming work cold** — the next session's `hot-read brain` returns a snapshot written by *this* command, with branch, last commit, tmux fleet, and recent Oracle context already in it

## Workflow examples

### Example 1: Pre-/clear ritual under context pressure

**Before snapshot:**
brain hits 72% context. Spec says: run `hot-write brain <<EOF...`, then
`log-session-write brain <<EOF...`, then `do-rag learn "[RESUME] brain ..."`.
That's three commands, three heredocs, three chances to typo a tag and lose
the entry to Oracle search. Under pressure, brain skips the log-session step
and `/clear`s. Next session wakes, runs `hot-read brain`, sees a stale
snapshot from yesterday. ~10 minutes lost reconstructing state from `git log`
and `tmux ls`.

**With snapshot:**
```bash
maw snapshot --close
/clear
```
Output:
```
snapshot: close written
  → Oracle [HOT] brain (via hot-write CLI)
  → ~/.maw/brain/session-log.md
  → oracle: [CLOSE]
```
Auto-detected: branch, last commit, pending changes, all tmux sessions,
last Oracle entry. All three destinations written atomically (failures fall
back to a local file, never silent-swallowed).

**Result:** Next `hot-read brain` returns a fresh, accurate snapshot. Zero
manual heredoc typing. Zero forgotten writes.

### Example 2: Milestone mid-session

**Before snapshot:**
brain finishes Phase 1A — a sprint that took 4 hours and shipped 12 commits.
Wants to mark it but doesn't want to do the full /rrr ritual. Writes a quick
`do-rag learn "Phase 1A done"` and moves on. Two days later, searching
Oracle for "phase 1A", the entry comes back but with no branch context, no
commit hash, no tmux state — just the text. Useless for resuming.

**With snapshot:**
```bash
maw snapshot --milestone "Phase 1A spec completed"
```
The Oracle entry written by `jod` includes:
```
[MILESTONE-phase-1a-spec-completed] milestone snapshot
branch: main
commit: a3f7b21 spec: ship Phase 1A
pending: clean
tmux: brain:0, nicky:0, micky:0
ts: 2026-05-18T03:14:00Z
```

**Result:** Two days later, "phase 1A" search returns a full state capsule.
Resuming the line of work is a `git checkout a3f7b21` away.

### Example 3: RRR retrospective

**Before snapshot:**
End-of-session retrospective lives in three places — the [RRR-YYYY-MM-DD]
Oracle entry, the brain session log, and the [HOT] brain snapshot. Writing
them by hand means three heredocs and the standard "did / learned / next"
template repeated three times.

**With snapshot:**
```bash
maw snapshot --rrr "shipped 4 plugins, learned cross-node callback gap"
```
The milestone field auto-formats as `[RRR-2026-05-18]` so the entry sorts
correctly in Oracle search. All three writers receive the same context with
zero copy-paste.

**Result:** RRR ritual collapses from ~3 minutes of typing to one line.

### Example 4: Quiet mode in scripts

Pre-commit hook that snapshots before risky pushes:
```bash
#!/usr/bin/env bash
# .git/hooks/pre-push
maw snapshot --quiet --milestone "pre-push $(git rev-parse --short HEAD)"
```

**Result:** Every push is durably stamped. Stdout stays clean for the
caller. If `do-rag` is down, `jod` falls back to a local JSONL file at
`~/.maw/brain/jod-entries.jsonl` — no failed push.

## Real session transcript

```
$ maw snapshot --milestone "USE-CASES docs shipped for spec-lint + session-snapshot"
snapshot: milestone written
  → Oracle [HOT] brain (via hot-write CLI)
  → ~/.maw/brain/session-log.md
  → oracle: [MILESTONE-use-cases-docs-shipped-for-spec-lint-session-snapsho]

$ hot-read brain
active: [MILESTONE-use-cases-docs-shipped-for-spec-lint-session-snapsho]
pending:
  - (auto-snapshot · review)
recent:
  - milestone @ 2026-05-18T03:42 · branch agents/73-plugin-docs-writer2
  - tmux: brain:0, nicky:0, vicky:1, micky:0
next: continue current work
```

The trail is queryable: `do-rag "MILESTONE use-cases"` returns the jod
entry; `tail ~/.maw/brain/session-log.md` returns the appended log line;
`hot-read brain` returns the supersede-current state.

## When NOT to use this

- **Inside the worker agent loop.** Workers should call back to brain via
  `maw-chat` and let brain snapshot. Snapshotting from every worker pollutes
  brain's hot-state with worker-local context.
- **As a substitute for /rrr.** `--rrr` is a *stamp*, not a retrospective.
  The reflective writing still needs to happen in the Oracle entry body or
  the session log — snapshot just guarantees the writes land in the right
  three places.
- **For sub-second telemetry.** Each snapshot shells out to `do-rag` and
  `hot-write` (with file fallbacks). Calling it in a tight loop is fine but
  not free; use append-only file writes for high-frequency events.

## Related plugins

- [`maw-plugin-spec-lint`](https://github.com/natkingsize2/maw-plugin-spec-lint) — pre-flight check before the dispatch that this snapshot will later record
- [`maw-plugin-anchor-check`](https://github.com/natkingsize2/maw-plugin-anchor-check) — validates the decision anchors that the milestone text often references
- [`maw-plugin-fleet-reap`](https://github.com/natkingsize2/maw-plugin-fleet-reap) — pairs with `--close`: snapshot, then reap dead tmux panes before `/clear`

## Origin story

Built 2026-05-17 from a build spec that asked one question: *what is the
minimum command that captures brain state durably enough that the next
session can resume cold?* The answer was the existing three-writer pattern
(hot-write + log-session + jod) collapsed behind one flag. Auto-detection
of git, tmux, and recent Oracle context was added so the caller never has
to copy-paste state into the heredoc. Scope is narrow: three flags
(`--milestone`, `--close`, `--rrr`), three destinations, fallbacks to local
files if Oracle / hot-write CLIs are unavailable. The "Cold God" Oracle
principle applies — the snapshot mirrors what happened, it doesn't
interpret.
