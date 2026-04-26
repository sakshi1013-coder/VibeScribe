import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db, pool } from "./src/lib/db";
import { user, account } from "./src/lib/schema";
import { hash } from "bcryptjs";
import { eq, or } from "drizzle-orm";

async function seed() {
  console.log("Seeding admin user...\n");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@buzrt.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminUsername = process.env.ADMIN_USERNAME || "admin";

  const userId = crypto.randomUUID();
  const hashedPassword = await hash(adminPassword, 10);

  try {
    // Delete existing admin user if exists (cascade will delete account)
    const existingUsers = await db
      .select()
      .from(user)
      .where(
        or(
          eq(user.email, adminEmail),
          eq(user.username, adminUsername)
        )
      );

    if (existingUsers.length > 0) {
      console.log("Deleting existing admin user...");
      await db.delete(user).where(
        or(
          eq(user.email, adminEmail),
          eq(user.username, adminUsername)
        )
      );
    }

    // Insert user
    console.log("Creating user...");
    await db.insert(user).values({
      id: userId,
      name: "Admin User",
      email: adminEmail,
      username: adminUsername,
      displayUsername: adminUsername,
    });

    // Insert account - password as TEXT (bcrypt hash)
    console.log("Creating account with credentials...");
    await db.insert(account).values({
      id: crypto.randomUUID(),
      userId: userId,
      accountId: adminUsername,
      providerId: "credential",
      password: hashedPassword,  // Store as plain TEXT (bcrypt hash)
    });

    console.log("\n✅ Admin user created successfully!");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`\n🔐 Password hash: ${hashedPassword.substring(0, 30)}...`);
  } catch (error: any) {
    console.error("\n❌ Error seeding admin:", error.message || error);
  } finally {
    await pool.end();
  }
}

seed();
