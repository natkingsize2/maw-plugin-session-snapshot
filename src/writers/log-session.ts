import { appendFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { SnapshotContext } from "../snapshot";

/**
 * Log-session: append to session log file.
 * Writes to ~/.maw/brain/session-log.md
 */
export function appendSessionLog(ctx: SnapshotContext): string {
  const dir = join(homedir(), ".maw", "brain");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const path = join(dir, "session-log.md");

  const entry = [
    ``,
    `## ${ctx.timestamp} — ${ctx.milestone}`,
    ``,
    `- **Kind:** ${ctx.kind}`,
    `- **Branch:** ${ctx.branch}  |  ${ctx.lastCommit}`,
    `- **Changes:** ${ctx.pendingChanges}`,
    `- **Sessions:** ${ctx.tmuxSessions}`,
    `- **Oracle:** ${ctx.oracleRecent}`,
    ctx.extra?.did ? `- **Did:** ${ctx.extra.did}` : "",
    ctx.extra?.learned ? `- **Learned:** ${ctx.extra.learned}` : "",
    ctx.extra?.next ? `- **Next:** ${ctx.extra.next}` : "",
    ``,
  ].filter(Boolean).join("\n");

  appendFileSync(path, entry, "utf-8");
  return path;
}
