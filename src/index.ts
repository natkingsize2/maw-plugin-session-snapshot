import { doSnapshot, SnapshotOptions } from "./snapshot";

interface PluginEvent {
  source: string;
  args: string[];
  writer?: (text: string) => void;
}

export default async function handler(event: PluginEvent): Promise<{ ok: boolean; output?: string; error?: string }> {
  const args = event.args;
  const writer = event.writer ?? ((s: string) => process.stdout.write(s + "\n"));

  let options: SnapshotOptions | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--milestone" && i + 1 < args.length) {
      options = { kind: "milestone", text: args[++i], quiet: false };
    } else if (arg === "--close") {
      options = { kind: "close", text: args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "session-end", quiet: false };
    } else if (arg === "--rrr") {
      options = { kind: "rrr", text: args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "", quiet: false };
    } else if (arg === "--quiet") {
      if (options) options.quiet = true;
    }
  }

  if (!options) {
    return { ok: false, error: "Usage: maw snapshot --milestone <text> | --close | --rrr" };
  }

  try {
    const result = await doSnapshot(options);
    if (!options.quiet) {
      writer(`snapshot: ${result.kind} written`);
      for (const p of result.paths) writer(`  → ${p}`);
    }
    return { ok: true, output: JSON.stringify(result) };
  } catch (err: any) {
    return { ok: false, error: err.message ?? String(err) };
  }
}
