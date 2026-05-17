import { execSync } from "child_process";

/**
 * Detect last Oracle entries (recent decisions/knowledge).
 * Uses do-rag CLI or falls back to Oracle API.
 */
export async function detectOracleRecent(): Promise<string> {
  try {
    const output = execSync("do-rag 'last snapshot milestone decision' 2>/dev/null", {
      encoding: "utf-8",
      timeout: 10000,
      stdio: "pipe",
    });
    const trimmed = output.trim();
    if (trimmed.length === 0) return "oracle: empty response";
    // Take first few lines
    const lines = trimmed.split("\n").filter(Boolean).slice(0, 5);
    return `oracle: ${lines.join(" | ")}`;
  } catch {
    // Try direct HTTP to Oracle
    try {
      const url = process.env.ORACLE_URL || "http://localhost:47778";
      const http = execSync(
        `curl -s --max-time 5 "${url}/search?q=last+decision&limit=3" 2>/dev/null || echo 'oracle: unreachable'`,
        { encoding: "utf-8", timeout: 10000, stdio: "pipe" }
      );
      return http.trim().slice(0, 200);
    } catch {
      return "oracle: unreachable";
    }
  }
}
