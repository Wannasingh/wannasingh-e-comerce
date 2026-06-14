import oracledb from "oracledb";

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * GET /oracle-test
 * Custom health check and connectivity test for Oracle Database.
 */
export async function GET(_req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const tnsAdmin = process.env.TNS_ADMIN ?? "/Users/haru/oracle-26-ai/APPSDB/Wallet_APPSDB/";
  const user = process.env.ORACLE_USER ?? "ADMIN";
  const password = process.env.ORACLE_PASSWORD;
  const connectString = process.env.ORACLE_CONNECTION_STRING ?? "appsdb_high";

  // Ensure TNS_ADMIN is set in the environment so Oracle client can resolve the alias
  process.env.TNS_ADMIN = tnsAdmin;

  if (!password) {
    res.status(400).json({
      status: "error",
      message: "ORACLE_PASSWORD environment variable is not defined",
      details: {
        tnsAdmin,
        user,
        connectString,
      },
    });
    return;
  }

  let connection;
  try {
    const cleanTnsAdmin = tnsAdmin.endsWith("/") ? tnsAdmin.slice(0, -1) : tnsAdmin;
    // Connect to the database using Thin mode (default in node-oracledb v6)
    connection = await oracledb.getConnection({
      user,
      password,
      connectString,
      configDir: cleanTnsAdmin,
      walletLocation: cleanTnsAdmin,
      walletPassword: password, // Wallet password is the same as database password
    });

    // Run a query to test connectivity
    const result = await connection.execute(
      `SELECT sysdate AS current_time, 
              (SELECT user FROM dual) AS current_user,
              (SELECT global_name FROM global_name) AS db_name
       FROM dual`
    );

    res.status(200).json({
      status: "success",
      message: "Successfully connected to Oracle Database",
      connectionInfo: {
        user,
        connectString,
        tnsAdmin,
      },
      data: result.rows,
    });
  } catch (err: unknown) {
    const error = err as Error;
    res.status(500).json({
      status: "error",
      message: "Failed to connect to Oracle Database",
      errorMessage: error.message,
      errorStack: error.stack,
      connectionInfo: {
        user,
        connectString,
        tnsAdmin,
      },
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("Error closing Oracle connection:", closeErr);
      }
    }
  }
}
