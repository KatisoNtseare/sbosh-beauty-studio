import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";
import { validateTestDatabaseUri } from "../src/lib/test-database-config";

class SafeSetupError extends Error {}

async function main() {
  loadEnvConfig(process.cwd());
  const testUrl = validateTestDatabaseUri(process.env.MONGODB_TEST_URI);
  const replicaSetName = testUrl.searchParams.get("replicaSet")!;
  const port = testUrl.port || "27017";
  const hostname = testUrl.hostname.replace(/^\[|\]$/g, "");
  const replicaHost = hostname.includes(":") ? `[${hostname}]:${port}` : `${hostname}:${port}`;
  const directUrl = new URL(testUrl);
  directUrl.pathname = "/admin";
  directUrl.search = "";
  directUrl.searchParams.set("directConnection", "true");

  const connection = await mongoose.createConnection(directUrl.toString(), { serverSelectionTimeoutMS: 4_000 }).asPromise();
  try {
    const admin = connection.db?.admin();
    if (!admin) throw new SafeSetupError("The local MongoDB admin connection is unavailable.");

    let status: { set?: string } | undefined;
    try {
      status = await admin.command({ replSetGetStatus: 1 });
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? Number(error.code) : 0;
      const codeName = error && typeof error === "object" && "codeName" in error ? String(error.codeName) : "";
      if (code !== 94 && codeName !== "NotYetInitialized") {
        throw new SafeSetupError("Start the dedicated local mongod with --replSet " + replicaSetName + " before initializing it.");
      }
      try {
        await admin.command({ replSetInitiate: { _id: replicaSetName, members: [{ _id: 0, host: replicaHost }] } });
      } catch (initError) {
        const initCode = initError && typeof initError === "object" && "code" in initError ? Number(initError.code) : 0;
        const initCodeName = initError && typeof initError === "object" && "codeName" in initError ? String(initError.codeName) : "";
        if (initCode !== 23 && initCodeName !== "AlreadyInitialized") throw initError;
      }
    }
    if (status?.set && status.set !== replicaSetName) {
      throw new SafeSetupError("The local MongoDB replica set name does not match MONGODB_TEST_URI.");
    }

    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const hello = await admin.command({ hello: 1 });
        if (hello.setName !== replicaSetName) throw new SafeSetupError("The local MongoDB replica set name does not match MONGODB_TEST_URI.");
        if (hello.isWritablePrimary) {
          console.log("The local sbosh_beauty_test replica set is ready.");
          return;
        }
      } catch (error) {
        if (error instanceof SafeSetupError) throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new SafeSetupError("The local MongoDB replica set did not elect a primary. Check the mongod log.");
  } finally {
    await connection.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof SafeSetupError ? error.message : "Local test replica set initialization failed. Check MongoDB availability and the local mongod log.");
  process.exitCode = 1;
});
