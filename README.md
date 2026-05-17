# maw-session-snapshot

One-command save of brain state. Combines **hot-write** (brain memory), **log-session** (session log), and **Oracle jod** (searchable entry) into a single `maw snapshot` command.

## Why

A brain session that ends without writing all three of `hot-write`, `log-session`,
and Oracle `jod` leaves the *next* session amnesic — `hot-read brain` returns
stale state and ~10 minutes are lost reconstructing context from `git log` and
`tmux ls`. Under 70%-context pressure, hand-typing three heredocs invites
skipped writes. `maw snapshot` collapses the ritual into one command with
auto-detected git, tmux, and Oracle context, with file fallbacks so the writes
never silently fail.

See [USE-CASES.md](./USE-CASES.md) for concrete workflows, a real session
transcript, and when *not* to use this plugin.

## Usage

```bash
# Record a milestone
maw snapshot --milestone "Phase 1A spec completed"

# End session
maw snapshot --close

# Retrospective milestone
maw snapshot --rrr

# Quiet mode (no stdout)
maw snapshot --quiet --milestone "done"
```

## What it does

When run, `snapshot` auto-detects:

| Detector       | Source              |
|----------------|---------------------|
| `git-status`   | Current branch, last commit, pending changes |
| `tmux-state`   | Active tmux sessions and windows (fleet)     |
| `oracle-recent`| Last Oracle entry / decision                  |

Then writes to **3 destinations**:

| Writer           | Destination                                       |
|------------------|---------------------------------------------------|
| `hot-write`      | `~/.maw/brain/hot-brain.md` (brain memory)        |
| `log-session`    | `~/.maw/brain/session-log.md` (session log)       |
| `jod`            | Oracle via `do-rag learn` (searchable entry)       |

## Flag reference

| Flag              | Description                                |
|-------------------|--------------------------------------------|
| `--milestone TEXT`| Save milestone snapshot with given label   |
| `--close`         | Session-end ritual (adds session-end tag)  |
| `--rrr`           | Retrospective milestone ([RRR-<date>])     |
| `--quiet`         | Suppress stdout output                     |

## Files

```
plugins/session-snapshot/
├── plugin.json                  Plugin manifest
├── src/
│   ├── index.ts                 CLI handler
│   ├── snapshot.ts              Core orchestrator
│   ├── detectors/
│   │   ├── git-status.ts        Git context
│   │   ├── tmux-state.ts        Tmux fleet state
│   │   └── oracle-recent.ts     Recent Oracle entries
│   └── writers/
│       ├── hot-write.ts         Brain memory writer
│       ├── log-session.ts       Session log writer
│       └── jod.ts               Oracle jod writer
├── test/
│   └── snapshot.test.ts         Test suite
└── README.md                    This file
```

## Build & Test

```bash
cd plugins/session-snapshot
npm install
npm test
```

## License

MIT
