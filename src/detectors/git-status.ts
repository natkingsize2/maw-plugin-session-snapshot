import { execSync } from "child_process";

/**
 * Detect git status: branch, last commit, pending changes.
 * Returns multiline string split in snapshot.ts.
 */
export async function detectGitStatus(): Promise<string> {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
      timeout: 5000,
      stdio: "pipe",
    }).trim();
    const lastCommit = execSync("git log -1 --format='%h %s'", {
      encoding: "utf-8",
      timeout: 5000,
      stdio: "pipe",
    }).trim();
    const status = execSync("git status --short", {
      encoding: "utf-8",
      timeout: 5000,
      stdio: "pipe",
    }).trim();
    return [branch, lastCommit, status].join("\n");
  } catch (e: any) {
    return `no-git-repo: ${e.message ?? "unknown"}`;
  }
}
