import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testDb() {
  console.log("Checking Database Connection...");
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.includes("localhost")) {
    console.error("❌ DATABASE_URL is missing or local. Please use the Railway Public connection string.");
    return;
  }

  if (connectionString.includes(".internal")) {
    console.error("❌ You are using an INTERNAL Railway URL. This only works inside Railway's network.");
    console.error("👉 Please use the PUBLIC connection string from Railway instead.");
    return;
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("✅ Database connection successful!");
    const res = await client.query('SELECT NOW()');
    console.log("Database time:", res.rows[0].now);
    await client.end();
  } catch (error: any) {
    console.error("❌ Database Connection Error:", error.message || error);
    if (error.message.includes("ENOTFOUND")) {
       console.error("Hint: The hostname could not be found. Double check your connection string.");
    }
  }
}

testDb();
