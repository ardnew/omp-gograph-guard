import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import install from "./index.js";

test("blocks symbol searches in Go workspaces with an index", () => {
  const root = mkdtempSync(join(tmpdir(), "omp-gograph-guard-"));
  try {
    const go = join(root, "go");
    const plain = join(root, "plain");
    const unindexed = join(root, "unindexed");
    const workspace = join(root, "workspace");
    const nested = join(go, "nested");
    const foreign = join(go, "foreign");
    for (const dir of [go, plain, unindexed, workspace, nested, foreign]) mkdirSync(dir);
    for (const dir of [go, plain, workspace, foreign]) mkdirSync(join(dir, ".gograph"));
    for (const dir of [go, unindexed]) {
      writeFileSync(join(dir, "go.mod"), "module example.com/guard\n\ngo 1.20\n");
    }
    writeFileSync(join(workspace, "go.work"), "go 1.20\n");
    mkdirSync(join(foreign, ".git"));

    let handler;
    install({ on(_name, fn) { handler = fn; } });
    const call = (cwd, command, input = {}, toolName = "bash") =>
      handler({ toolName, input: { command, ...input } }, { cwd });

    for (const cwd of [go, nested, workspace]) {
      const result = call(cwd, "rg Enumerate .");
      assert.equal(result?.block, true);
      assert.match(result.reason, /gograph_query/);
    }
    for (const cwd of [plain, unindexed, foreign]) {
      assert.equal(call(cwd, "rg Enumerate ."), undefined);
    }
    assert.equal(call(go, "rg TODO ."), undefined);
    assert.equal(call(go, 'rg Enumerate --glob "*.md" .'), undefined);
    assert.equal(call(go, "go version"), undefined);
    assert.equal(call(go, "rg Enumerate .", {}, "grep"), undefined);
    assert.equal(call(go, "rg Enumerate .", { cwd: plain })?.block, true);
    assert.equal(call(go, "rg Enumerate .", { cwd: unindexed }), undefined);

    const path = process.env.PATH;
    try {
      process.env.PATH = "";
      assert.throws(() => call(go, "rg Enumerate ."), { code: "ENOENT" });
      assert.equal(call(plain, "rg Enumerate ."), undefined);
    } finally {
      if (path === undefined) delete process.env.PATH;
      else process.env.PATH = path;
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
