import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
import { validateTestDatabaseUri } from "@/lib/test-database-config";

async function main() {
  const mutableEnv = process.env as unknown as Record<string, string | undefined>;
  const originalNodeEnv = process.env.NODE_ENV;
  mutableEnv.NODE_ENV = "development";
  loadEnvConfig(process.cwd(), true);
  if (originalNodeEnv) mutableEnv.NODE_ENV = originalNodeEnv;
  else delete mutableEnv.NODE_ENV;

  const testUri = process.env.MONGODB_TEST_URI;
  validateTestDatabaseUri(testUri);
  const child = spawn(process.execPath, [resolve("node_modules/vitest/vitest.mjs"), "run", "--config", "vitest.integration.config.ts"], {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "test", MONGODB_TEST_URI: testUri, MONGODB_URI: testUri },
  });
  const exitCode = await new Promise<number>((resolveExit, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolveExit(code ?? (signal ? 1 : 0)));
  });
  process.exitCode = exitCode;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Integration test setup failed.");
  process.exitCode = 1;
});
