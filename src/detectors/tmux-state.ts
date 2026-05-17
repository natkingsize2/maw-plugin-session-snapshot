import { execSync } from "child_process";

/**
 * Detect tmux sessions and windows (fleet state).
 */
export async function detectTmuxState(): Promise<string> {
  try {
    const output = execSync("tmux list-sessions -F '#{session_name}' 2>/dev/null; tmux list-windows -a -F '#{session_name}:#{window_name}' 2>/dev/null", {
      encoding: "utf-8",
      timeout: 5000,
      stdio: "pipe",
    });
    const lines = output.trim().split("\n").filter(Boolean);
    if (lines.length === 0) return "no tmux sessions";
    const sessions = new Map<string, string[]>();
    for (const line of lines) {
      const colon = line.indexOf(":");
      if (colon === -1) {
        if (!sessions.has(line)) sessions.set(line, []);
      } else {
        const s = line.slice(0, colon);
        const w = line.slice(colon + 1);
        if (!sessions.has(s)) sessions.set(s, []);
        sessions.get(s)!.push(w);
      }
    }
    return [...sessions.entries()]
      .map(([s, ws]) => `${s} (${ws.length} windows): ${ws.join(", ")}`)
      .join("\n");
  } catch {
    return "no tmux (not in tmux)";
  }
}
