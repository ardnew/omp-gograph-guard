import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

function isGoWorkspace(dir) {
  for (;;) {
    if (existsSync(join(dir, "go.mod")) || existsSync(join(dir, "go.work"))) return true;
    const parent = dirname(dir);
    if (parent === dir || existsSync(join(dir, ".git"))) return false;
    dir = parent;
  }
}

export default function (pi) {
  pi.on("tool_call", (event, ctx) => {
    if (event.toolName !== "bash" || !isGoWorkspace(ctx.cwd)) return;
    const result = spawnSync("gograph", ["hook-guard"], {
      cwd: ctx.cwd,
      input: JSON.stringify({
        tool_name: "Bash",
        tool_input: event.input,
        cwd: event.input.cwd || ctx.cwd,
      }),
      encoding: "utf8",
      timeout: 5000,
    });
    if (result.error) throw result.error;
    if (result.status === 2) {
      return { block: true, reason: result.stdout || result.stderr || "gograph blocked this command." };
    }
    if (result.status !== 0) throw new Error(result.stderr || "The gograph check failed.");
  });
}
