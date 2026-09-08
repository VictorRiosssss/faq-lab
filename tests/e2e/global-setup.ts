import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * Runs once before the whole Playwright suite. Requires DATABASE_URL to
 * point at a disposable test database — this truncates every mutable table.
 *
 * Shelled out to `tsx` (rather than importing db-reset.ts directly) because
 * Playwright's own TypeScript loader can't handle the `import.meta.url`
 * emitted by Prisma 7's generated client — tsx runs it as proper ESM.
 */
export default function globalSetup() {
  const scriptPath = path.resolve(__dirname, "../fixtures/db-reset.ts");
  const tsxCli = path.resolve(__dirname, "../../node_modules/tsx/dist/cli.mjs");
  execFileSync(process.execPath, [tsxCli, scriptPath], {
    stdio: "inherit",
  });
}
