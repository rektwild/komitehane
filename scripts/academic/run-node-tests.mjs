import {spawnSync} from "node:child_process";
import {existsSync, readdirSync} from "node:fs";
import {join} from "node:path";

// Some tests merged from main use node:test rather than Vitest.
// On older feature branches those tests and their alias loader are absent.
const aliasLoader = "scripts/register-test-alias.mjs";
const tests = [
  "lib/auth-entry.test.ts",
  ...(existsSync("lib/news")
    ? readdirSync("lib/news").filter(name => name.endsWith(".test.ts")).map(name => join("lib/news", name))
    : []),
].filter(existsSync);

if (!existsSync(aliasLoader) || tests.length === 0) {
  console.log("No Node.js test suites on this branch; academic Vitest suite completed.");
} else {
  const result = spawnSync(
    process.execPath,
    ["--import", `./${aliasLoader}`, "--test", ...tests],
    {stdio: "inherit"},
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
