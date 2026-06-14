import path from "path";

import dotenv from "dotenv";
import oracledb from "oracledb";

// Load environment variables from backend .env, then fallback to root .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const backendPassword = process.env.ORACLE_PASSWORD;

// If backend password is not set or is the placeholder, try root .env
if (!backendPassword || backendPassword === "your_oracle_password_here") {
  dotenv.config({ path: path.resolve(__dirname, "../../../../.env"), override: true });
}

async function run(): Promise<void> {
  const tnsAdmin = process.env.TNS_ADMIN ?? "/Users/haru/oracle-26-ai/APPSDB/Wallet_APPSDB/";
  const user = process.env.ORACLE_USER ?? "ADMIN";
  const password = process.env.ORACLE_PASSWORD;
  const connectString = process.env.ORACLE_CONNECTION_STRING ?? "appsdb_high";

  process.env.TNS_ADMIN = tnsAdmin;

  console.log("Oracle Client Connection Test");
  console.log("-----------------------------");
  console.log(`TNS_ADMIN: ${tnsAdmin}`);
  console.log(`Connection String: ${connectString}`);
  console.log(`User: ${user}`);
  console.log(`Password (masked): ${password ? "*".repeat(password.length) : "not set"}`);
  console.log("-----------------------------");

  // Explicitly initialize Thin mode configuration directory
  try {
    oracledb.initOracleClient({ configDir: tnsAdmin });
    console.log("Initialized Oracle Client with configDir:", tnsAdmin);
  } catch (initErr: unknown) {
    const error = initErr as Error;
    console.log("Oracle Client already initialized or failed to initialize:", error.message);
  }

  if (!password || password === "your_oracle_password_here") {
    console.error("❌ ERROR: ORACLE_PASSWORD is not set or is still the placeholder.");
    return;
  }

  let connection;
  // Try 1: Standard connection with TNS_ADMIN without trailing slash
  try {
    const cleanTnsAdmin = tnsAdmin.endsWith("/") ? tnsAdmin.slice(0, -1) : tnsAdmin;
    process.env.TNS_ADMIN = cleanTnsAdmin;
    console.log(`\n--- Attempt 1: TNS_ADMIN without trailing slash (${cleanTnsAdmin}) ---`);
    connection = await oracledb.getConnection({
      user,
      password,
      connectString,
    });
    console.log("✅ SUCCESS (Attempt 1): Connected successfully!");
    const result = await connection.execute("SELECT sysdate FROM dual");
    console.log("Query Result:", result.rows);
    return;
  } catch (err: unknown) {
    const error = err as Error;
    console.error("❌ Attempt 1 failed:", error.message);
  } finally {
    if (connection) {
      await connection.close();
      connection = null;
    }
  }

  // Try 2: With walletPassword set to database password (common setup)
  try {
    const cleanTnsAdmin = tnsAdmin.endsWith("/") ? tnsAdmin.slice(0, -1) : tnsAdmin;
    process.env.TNS_ADMIN = cleanTnsAdmin;
    console.log(`\n--- Attempt 2: With walletPassword set to database password ---`);
    connection = await oracledb.getConnection({
      user,
      password,
      connectString,
      walletPassword: password,
    });
    console.log("✅ SUCCESS (Attempt 2): Connected successfully!");
    const result = await connection.execute("SELECT sysdate FROM dual");
    console.log("Query Result:", result.rows);
    return;
  } catch (err: unknown) {
    const error = err as Error;
    console.error("❌ Attempt 2 failed:", error.message);
  } finally {
    if (connection) {
      await connection.close();
      connection = null;
    }
  }

  // Try 3: With explicitly passed configDir and walletLocation (Thin mode mTLS requirement)
  try {
    const cleanTnsAdmin = tnsAdmin.endsWith("/") ? tnsAdmin.slice(0, -1) : tnsAdmin;
    console.log(`\n--- Attempt 3: configDir and walletLocation passed explicitly ---`);
    connection = await oracledb.getConnection({
      user,
      password,
      connectString,
      configDir: cleanTnsAdmin,
      walletLocation: cleanTnsAdmin,
    });
    console.log("✅ SUCCESS (Attempt 3): Connected successfully!");
    const result = await connection.execute("SELECT sysdate FROM dual");
    console.log("Query Result:", result.rows);
    return;
  } catch (err: unknown) {
    const error = err as Error;
    console.error("❌ Attempt 3 failed:", error.message);
  } finally {
    if (connection) {
      await connection.close();
      connection = null;
    }
  }

  // Try 4: With configDir, walletLocation, and walletPassword set to database password
  try {
    const cleanTnsAdmin = tnsAdmin.endsWith("/") ? tnsAdmin.slice(0, -1) : tnsAdmin;
    console.log(`\n--- Attempt 4: configDir + walletLocation + walletPassword (database password) ---`);
    connection = await oracledb.getConnection({
      user,
      password,
      connectString,
      configDir: cleanTnsAdmin,
      walletLocation: cleanTnsAdmin,
      walletPassword: password,
    });
    console.log("✅ SUCCESS (Attempt 4): Connected successfully!");
    const result = await connection.execute("SELECT sysdate FROM dual");
    console.log("Query Result:", result.rows);
    return;
  } catch (err: unknown) {
    const error = err as Error;
    console.error("❌ Attempt 4 failed:", error.message);
  } finally {
    if (connection) {
      await connection.close();
      connection = null;
    }
  }
}

void run();
