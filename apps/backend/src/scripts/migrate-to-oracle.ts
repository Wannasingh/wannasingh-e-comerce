import path from "path";

import dotenv from "dotenv";
import oracledb from "oracledb";
import { Client } from "pg";

// Load environment variables from backend .env, then fallback to root .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const backendPassword = process.env.ORACLE_PASSWORD;

if (!backendPassword || backendPassword === "your_oracle_password_here") {
  dotenv.config({ path: path.resolve(__dirname, "../../../../.env"), override: true });
}

interface ProductData {
  id: string;
  title: string;
  handle: string | null;
  subtitle: string | null;
  description: string | null;
  status: string;
  thumbnail: string | null;
  created_at: Date;
  updated_at: Date;
}

interface CustomerData {
  id: string;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
}

async function run(): Promise<void> {
  console.log("=========================================");
  console.log("🚀 STARTING POSTGRES TO ORACLE MIGRATION 🚀");
  console.log("=========================================");

  // 1. Setup PostgreSQL Client
  const pgUrl = process.env.DATABASE_URL;
  if (!pgUrl) {
    console.error("❌ ERROR: DATABASE_URL environment variable is missing.");
    process.exit(1);
  }

  const pgClient = new Client({
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false },
  });

  // 2. Setup Oracle connection details
  const tnsAdmin = process.env.TNS_ADMIN ?? "/Users/haru/oracle-26-ai/APPSDB/Wallet_APPSDB/";
  const user = process.env.ORACLE_USER ?? "ADMIN";
  const password = process.env.ORACLE_PASSWORD;
  const connectString = process.env.ORACLE_CONNECTION_STRING ?? "appsdb_high";
  const cleanTnsAdmin = tnsAdmin.endsWith("/") ? tnsAdmin.slice(0, -1) : tnsAdmin;

  if (!password) {
    console.error("❌ ERROR: ORACLE_PASSWORD environment variable is missing.");
    process.exit(1);
  }

  // Explicitly initialize Thin mode configuration directory
  try {
    oracledb.initOracleClient({ configDir: cleanTnsAdmin });
  } catch (_err: unknown) {
    // Already initialized is fine
  }

  let oracleConn: oracledb.Connection | null = null;

  try {
    // Connect to PostgreSQL
    await pgClient.connect();
    console.log("✅ Connected to PostgreSQL (Supabase)");

    // Connect to Oracle
    oracleConn = await oracledb.getConnection({
      user,
      password,
      connectString,
      configDir: cleanTnsAdmin,
      walletLocation: cleanTnsAdmin,
      walletPassword: password,
    });
    console.log("✅ Connected to Oracle Database (@appsdb_high)");

    // 3. Ensure Target Tables Exist in Oracle
    console.log("\n--- Checking target tables in Oracle ---");
    const userTablesResult = await oracleConn.execute(
      `SELECT table_name FROM user_tables`
    );
    const existingTables = ((userTablesResult.rows ?? []) as unknown[][]).map((row) =>
      String(row[0]).toUpperCase()
    );

    // PRODUCTS table
    if (!existingTables.includes("PRODUCTS")) {
      console.log("Creating PRODUCTS table in Oracle...");
      await oracleConn.execute(`
        CREATE TABLE products (
          id VARCHAR2(255) PRIMARY KEY,
          title VARCHAR2(500) NOT NULL,
          handle VARCHAR2(500),
          subtitle VARCHAR2(500),
          description CLOB,
          status VARCHAR2(50),
          thumbnail VARCHAR2(1000),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Created PRODUCTS table.");
    } else {
      console.log("✅ PRODUCTS table already exists in Oracle.");
    }

    // CUSTOMERS table
    if (!existingTables.includes("CUSTOMERS")) {
      console.log("Creating CUSTOMERS table in Oracle...");
      await oracleConn.execute(`
        CREATE TABLE customers (
          id VARCHAR2(255) PRIMARY KEY,
          company_name VARCHAR2(255),
          first_name VARCHAR2(255),
          last_name VARCHAR2(255),
          email VARCHAR2(255) NOT NULL,
          phone VARCHAR2(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Created CUSTOMERS table.");
    } else {
      console.log("✅ CUSTOMERS table already exists in Oracle.");
    }

    // 4. Migrate PRODUCTS
    console.log("\n--- Migrating Products ---");
    const pgProductsRes = await pgClient.query<ProductData>(`
      SELECT id, title, handle, subtitle, description, status, thumbnail, created_at, updated_at
      FROM product
      WHERE deleted_at IS NULL
    `);

    const products = pgProductsRes.rows;
    console.log(`Found ${String(products.length)} products in PostgreSQL.`);

    if (products.length > 0) {
      // Oracle MERGE statement for products
      const productMergeSql = `
        MERGE INTO products t
        USING DUAL ON (t.id = :id)
        WHEN MATCHED THEN
          UPDATE SET 
            t.title = :title,
            t.handle = :handle,
            t.subtitle = :subtitle,
            t.description = :description,
            t.status = :status,
            t.thumbnail = :thumbnail,
            t.updated_at = :updated_at
        WHEN NOT MATCHED THEN
          INSERT (id, title, handle, subtitle, description, status, thumbnail, created_at, updated_at)
          VALUES (:id, :title, :handle, :subtitle, :description, :status, :thumbnail, :created_at, :updated_at)
      `;

      // Upsert products one-by-one to handle CLOB bindings nicely.
      let migratedProductsCount = 0;
      for (const p of products) {
        await oracleConn.execute(productMergeSql, {
          id: p.id,
          title: p.title,
          handle: p.handle,
          subtitle: p.subtitle,
          description: p.description,
          status: p.status,
          thumbnail: p.thumbnail,
          created_at: p.created_at,
          updated_at: p.updated_at,
        });
        migratedProductsCount++;
      }
      console.log(`✅ Successfully migrated/updated ${String(migratedProductsCount)} products in Oracle.`);
    } else {
      console.log("No products to migrate.");
    }

    // 5. Migrate CUSTOMERS
    console.log("\n--- Migrating Customers ---");
    const pgCustomersRes = await pgClient.query<CustomerData>(`
      SELECT id, company_name, first_name, last_name, email, phone, created_at, updated_at
      FROM customer
      WHERE deleted_at IS NULL
    `);

    const customers = pgCustomersRes.rows;
    console.log(`Found ${String(customers.length)} customers in PostgreSQL.`);

    if (customers.length > 0) {
      // Oracle MERGE statement for customers
      const customerMergeSql = `
        MERGE INTO customers t
        USING DUAL ON (t.id = :id)
        WHEN MATCHED THEN
          UPDATE SET 
            t.company_name = :company_name,
            t.first_name = :first_name,
            t.last_name = :last_name,
            t.email = :email,
            t.phone = :phone,
            t.updated_at = :updated_at
        WHEN NOT MATCHED THEN
          INSERT (id, company_name, first_name, last_name, email, phone, created_at, updated_at)
          VALUES (:id, :company_name, :first_name, :last_name, :email, :phone, :created_at, :updated_at)
      `;

      let migratedCustomersCount = 0;
      for (const c of customers) {
        await oracleConn.execute(customerMergeSql, {
          id: c.id,
          company_name: c.company_name,
          first_name: c.first_name,
          last_name: c.last_name,
          email: c.email,
          phone: c.phone,
          created_at: c.created_at,
          updated_at: c.updated_at,
        });
        migratedCustomersCount++;
      }
      console.log(`✅ Successfully migrated/updated ${String(migratedCustomersCount)} customers in Oracle.`);
    } else {
      console.log("No customers to migrate.");
    }

    // Commit transaction
    await oracleConn.commit();
    console.log("\n💾 Oracle Transaction committed successfully.");

  } catch (err: unknown) {
    const error = err as Error;
    console.error("\n❌ ERROR during migration execution:", error.message);
    if (oracleConn) {
      try {
        console.log("Rolling back Oracle transaction...");
        await oracleConn.rollback();
      } catch (rbErr: unknown) {
        const rollbackError = rbErr as Error;
        console.error("Rollback failed:", rollbackError.message);
      }
    }
  } finally {
    // Close connections
    try {
      await pgClient.end();
      console.log("Disconnected from PostgreSQL.");
    } catch (_err: unknown) {
      // Ignore
    }

    if (oracleConn) {
      try {
        await oracleConn.close();
        console.log("Disconnected from Oracle Database.");
      } catch (_err: unknown) {
        // Ignore
      }
    }
    console.log("\nMigration script finished.");
  }
}

void run();
