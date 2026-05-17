import { execFileSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { SnapshotContext } from "../snapshot";

/**
 * Hot-write brain: call existing hot-write CLI tool (Oracle integration).
 * Falls back to local file if hot-write tool unavailable.
 */
export function writeHotBrain(ctx: SnapshotContext): string {
  const content = [
    `active: ${ctx.milestone}`,
    `pending:`,
    `  - (auto-snapshot · review)`,
    `recent:`,
    `  - ${ctx.kind} @ ${ctx.timestamp.slice(0, 16)} · branch ${ctx.branch}`,
    `  - tmux: ${ctx.tmuxSessions.slice(0, 60)}`,
    `next: continue ` + (ctx.kind === "close" ? "next session" : "current work"),
  ].join("\n");

  try {
    execFileSync("hot-write", ["brain"], {
      input: content,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return "Oracle [HOT] brain (via hot-write CLI)";
  } catch {
    const dir = join(homedir(), ".maw", "brain");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const path = join(dir, "hot-brain.md");
    writeFileSync(path, content, "utf-8");
    return path;
  }
}
