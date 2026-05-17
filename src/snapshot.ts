import { detectGitStatus } from "./detectors/git-status";
import { detectTmuxState } from "./detectors/tmux-state";
import { detectOracleRecent } from "./detectors/oracle-recent";
import { writeHotBrain } from "./writers/hot-write";
import { appendSessionLog } from "./writers/log-session";
import { writeJod } from "./writers/jod";

export interface SnapshotOptions {
  kind: "milestone" | "close" | "rrr";
  text: string;
  quiet: boolean;
}

export interface SnapshotContext {
  kind: string;
  milestone: string;
  timestamp: string;
  branch: string;
  lastCommit: string;
  pendingChanges: string;
  tmuxSessions: string;
  oracleRecent: string;
  extra?: Record<string, string>;
}

export interface SnapshotResult {
  kind: string;
  paths: string[];
}

export async function doSnapshot(opts: SnapshotOptions): Promise<SnapshotResult> {
  const ts = new Date().toISOString();
  const slug = makeSlug(opts.text || opts.kind);

  let branch = "unknown";
  let tmuxSessions = "unknown";
  let oracleRecent = "unknown";
  try { branch = await detectGitStatus(); } catch { /* keep default */ }
  try { tmuxSessions = await detectTmuxState(); } catch { /* keep default */ }
  try { oracleRecent = await detectOracleRecent(); } catch { /* keep default */ }

  const ctx: SnapshotContext = {
    kind: opts.kind,
    milestone: opts.kind === "rrr" ? `[RRR-${ts.slice(0, 10)}]` : opts.kind === "close" ? "[CLOSE]" : `[MILESTONE-${slug}]`,
    timestamp: ts,
    branch,
    lastCommit: "",
    pendingChanges: "",
    tmuxSessions,
    oracleRecent,
    extra: {},
  };

  // Split git status into parts
  const gitLines = ctx.branch.split("\n");
  ctx.branch = gitLines[0] || "unknown";
  ctx.lastCommit = gitLines[1] || "";
  ctx.pendingChanges = gitLines.slice(2).join("\n").trim() || "clean";

  if (opts.kind === "rrr") {
    ctx.extra = { did: "", learned: "", next: "" };
  }

  const paths: string[] = [];
  paths.push(await writeHotBrain(ctx));
  paths.push(await appendSessionLog(ctx));
  paths.push(await writeJod(ctx));

  return { kind: opts.kind, paths };
}

function makeSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}
