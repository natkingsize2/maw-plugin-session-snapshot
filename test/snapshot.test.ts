import { describe, it, expect, vi, beforeEach } from "vitest";
import { doSnapshot } from "../src/snapshot";

// Mock all detectors and writers
vi.mock("../src/detectors/git-status", () => ({
  detectGitStatus: vi.fn(() => Promise.resolve("main\nabc1234 feat: fix\n M src/index.ts")),
}));
vi.mock("../src/detectors/tmux-state", () => ({
  detectTmuxState: vi.fn(() => Promise.resolve("base (2 windows): bash, agent-tham")),
}));
vi.mock("../src/detectors/oracle-recent", () => ({
  detectOracleRecent: vi.fn(() => Promise.resolve("oracle: last decision: phase-1a spec")),
}));
vi.mock("../src/writers/hot-write", () => ({
  writeHotBrain: vi.fn(() => Promise.resolve("/tmp/.maw/brain/hot-brain.md")),
}));
vi.mock("../src/writers/log-session", () => ({
  appendSessionLog: vi.fn(() => Promise.resolve("/tmp/.maw/brain/session-log.md")),
}));
vi.mock("../src/writers/jod", () => ({
  writeJod: vi.fn(() => Promise.resolve("oracle: [MILESTONE-test]")),
}));

describe("doSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("produces milestone snapshot", async () => {
    const r = await doSnapshot({ kind: "milestone", text: "Phase 1A spec completed", quiet: true });
    expect(r.kind).toBe("milestone");
    expect(r.paths).toHaveLength(3);
    expect(r.paths[0]).toContain("hot-brain.md");
    expect(r.paths[1]).toContain("session-log.md");
    expect(r.paths[2]).toContain("MILESTONE");
  });

  it("produces close snapshot", async () => {
    const r = await doSnapshot({ kind: "close", text: "session-end", quiet: true });
    expect(r.kind).toBe("close");
    expect(r.paths).toHaveLength(3);
  });

  it("produces rrr snapshot", async () => {
    const r = await doSnapshot({ kind: "rrr", text: "", quiet: true });
    expect(r.kind).toBe("rrr");
    expect(r.paths).toHaveLength(3);
  });
});

describe("handler arg parsing", () => {
  it("parses --milestone flag", async () => {
    const handler = (await import("../src/index")).default;
    const r = await handler({ source: "cli", args: ["--milestone", "test-milestone"] });
    expect(r.ok).toBe(true);
  });

  it("rejects no flags", async () => {
    const handler = (await import("../src/index")).default;
    const r = await handler({ source: "cli", args: [] });
    expect(r.ok).toBe(false);
    expect(r.error).toContain("Usage");
  });

  it("rejects --milestone without text", async () => {
    const handler = (await import("../src/index")).default;
    const r = await handler({ source: "cli", args: ["--milestone"] });
    expect(r.ok).toBe(false);
  });
});
