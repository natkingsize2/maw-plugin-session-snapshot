import { execFileSync } from "child_process";
import { appendFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { SnapshotContext } from "../snapshot";

/**
 * Jod: Oracle entry · calls `do-rag learn` with stdin
 * Falls back to local jsonl if do-rag unavailable.
 */
export function writeJod(ctx: SnapshotContext): string {
  const jodText = [
    `[${ctx.milestone}] ${ctx.kind} snapshot`,
    `branch: ${ctx.branch}`,
    `commit: ${ctx.lastCommit}`,
    `pending: ${ctx.pendingChanges}`,
    `tmux: ${ctx.tmuxSessions}`,
    ctx.oracleRecent.startsWith("oracle:") ? "" : `oracle-feed: ${ctx.oracleRecent}`,
    ctx.extra?.did ? `did: ${ctx.extra.did}` : "",
    ctx.extra?.learned ? `learned: ${ctx.extra.learned}` : "",
    ctx.extra?.next ? `next: ${ctx.extra.next}` : "",
    `ts: ${ctx.timestamp}`,
  ].filter(Boolean).join("\n");

  try {
    execFileSync("do-rag", ["learn", "-"], {
      input: jodText,
      timeout: 15000,
      stdio: ["pipe", "pipe", "pipe"],
      encoding: "utf-8",
    });
    return `oracle: ${ctx.milestone}`;
  } catch {
    const dir = join(homedir(), ".maw", "brain");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const path = join(dir, "jod-entries.jsonl");
    appendFileSync(path, JSON.stringify({ ts: ctx.timestamp, milestone: ctx.milestone, kind: ctx.kind, branch: ctx.branch }) + "\n", "utf-8");
    return path;
  }
}
