# Authentication Setup - FIXED ✅

## 🎯 Problem Solved

The error `Cannot read properties of undefined (reading 'encrypted')` was caused by storing the password as a plain string instead of a JSON object. Better Auth expects:
```json
{ "encrypted": "bcrypt_hash_here" }
```

## 🔑 Login Credentials

```
Username: admin
Password: admin123
```

## 📁 Final Working Code

### 1. Database Schema (`src/lib/schema.ts`)

```typescript
import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

// Better Auth required tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  username: text("username").unique(),  // ✅ Username field
  displayUsername: text("displayUsername"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),  // ✅ Must be "credential"
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { mode: "date" }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { mode: "date" }),
  scope: text("scope"),
  password: jsonb("password").$type<{ encrypted: string }>(),  // ✅ JSONB with encrypted property
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});
```

**Key Changes:**
- ✅ Import `jsonb` from drizzle-orm
- ✅ `password` field is now `jsonb` type
- ✅ Type annotation: `$type<{ encrypted: string }>()`
- ✅ Stores password as JSON object: `{ encrypted: "hash" }`

---

### 2. Seed Script (`seed-admin.ts`)

```typescript
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
  const hashedPassword = await hash(adminPassword, 10);  // ✅ Hash with bcrypt

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

    // Insert account with password as JSON object
    console.log("Creating account with credentials...");
    await db.insert(account).values({
      id: crypto.randomUUID(),
      userId: userId,
      accountId: adminUsername,
      providerId: "credential",  // ✅ Use "credential" provider
      password: { encrypted: hashedPassword },  // ✅ Store as JSON object
    });

    console.log("\n✅ Admin user created successfully!");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
  } catch (error: any) {
    console.error("\n❌ Error seeding admin:", error.message || error);
  } finally {
    await pool.end();
  }
}

seed();
```

**Key Changes:**
- ✅ `providerId: "credential"` (not "username")
- ✅ `password: { encrypted: hashedPassword }` (JSON object, not string)
- ✅ Safe deletion of existing user before insert
- ✅ Password hashed with bcrypt (10 rounds)

---

### 3. Auth Configuration (`src/lib/auth.ts`)

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,  // ✅ Enable email/password auth
  },
  plugins: [
    username()  // ✅ Enable username plugin
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // update every day
  },
});

export type Auth = typeof auth;
```

**Key Points:**
- ✅ `baseURL` and `trustedOrigins` set to port 3001
- ✅ Both `emailAndPassword` and `username` plugin enabled
- ✅ Drizzle adapter configured with PostgreSQL

---

### 4. Auth Client (`src/lib/auth-client.ts`)

```typescript
import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",  // ✅ Correct port
  plugins: [usernameClient()],  // ✅ Username client plugin
});

export const { signIn, signOut, useSession } = authClient;
```

**Key Points:**
- Uses `usernameClient()` plugin
- `baseURL` must match your Next.js dev server port

---

### 5. Login Page (`src/app/login/page.tsx`)

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const { data, error: authError } = await signIn.username({
      username,  // ✅ Uses username (not email)
      password,
    });

    if (authError) {
      setError(authError.message || "Invalid credentials");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  } catch (err) {
    setError("An unexpected error occurred. Please try again.");
  } finally {
    setLoading(false);
  }
};
```

**Key Points:**
- Uses `signIn.username()` method
- Passes `username` and `password` fields
- Handles errors and redirects on success

---

### 6. Auth API Route (`src/app/api/auth/[...all]/route.ts`)

```typescript
import { toNodeHandler } from "better-auth/node";
import { auth } from "@/lib/auth";

export const { GET, POST } = {
  GET: toNodeHandler(auth.handler),
  POST: toNodeHandler(auth.handler),
};

export const dynamic = "force-dynamic";
```

**Key Points:**
- Handles all auth routes via Better Auth
- Uses Node.js handler adapter
- Dynamic route for all auth operations

---

### 7. Environment Variables (`.env.local`)

```env
# Database
DATABASE_URL="postgresql://..."

# Better Auth
BETTER_AUTH_SECRET="your-super-secret-key-change-this-in-production-at-least-32-chars"
BETTER_AUTH_URL="http://localhost:3000"  # ✅ Must match dev server port
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # ✅ Must match dev server port

# Admin credentials (used for seeding)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
ADMIN_EMAIL="admin@buzrt.com"
```

**Key Points:**
- `NEXT_PUBLIC_APP_URL` must match your Next.js port (default: 3000)
- `BETTER_AUTH_SECRET` should be at least 32 characters
- Admin credentials are used by seed script

---

## 🚀 How It Works

1. **User Table**: Stores user info including `username`
2. **Account Table**: Stores authentication credentials with:
   - `providerId: "credential"` - identifies this as credential-based auth
   - `accountId: "admin"` - the username
   - `password: { encrypted: "$2b$10$..." }` - **JSON object** with bcrypt hash
3. **Better Auth**: Handles authentication logic:
   - Receives username/password from client
   - Looks up user by username
   - Finds account with `providerId: "credential"`
   - Reads `password.encrypted` property
   - Compares password using bcrypt
   - Creates session if valid
4. **Client**: Sends credentials to `/api/auth/sign-in/username`

---

## 🔧 Setup Steps

1. **Push schema to database:**
   ```bash
   npm run db:push
   ```

2. **Seed admin user:**
   ```bash
   npm run db:seed
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

4. **Login at:** `http://localhost:3001/login`
   - Username: `admin`
   - Password: `admin123`

---

## ✅ What Was Fixed

### Before (❌ Broken):
```typescript
// Password stored as plain string
password: hashedPassword  // "Cannot read properties of undefined (reading 'encrypted')"
```

### After (✅ Working):
```typescript
// Password stored as JSON object
password: { encrypted: hashedPassword }  // Better Auth can read .encrypted property
```

### Database Comparison:

**Before:**
```sql
-- account table
password | text | "$2b$10$MPWqQvMdktHLIgnTzXrIJOQ..."
```

**After:**
```sql
-- account table  
password | jsonb | {"encrypted": "$2b$10$MPWqQvMdktHLIgnTzXrIJOQ..."}
```

---

## 🔒 Security Notes

- ✅ Passwords are hashed with bcrypt (10 rounds)
- ✅ Never store plain text passwords
- ✅ Password stored in account table, not user table
- ✅ Use strong `BETTER_AUTH_SECRET` in production
- ✅ Use HTTPS in production
- ✅ Consider adding rate limiting for login attempts
- ✅ JSON structure allows Better Auth to read `password.encrypted`

---

## 🐛 Troubleshooting

**Error: "Cannot read properties of undefined (reading 'encrypted')"**
- ✅ FIXED: Password must be stored as `{ encrypted: "hash" }` not just `"hash"`
- Run `npm run db:seed` to recreate admin user with correct format

**Error: "Invalid credentials"**
- Check that dev server is running on the correct port (3001)
- Verify `NEXT_PUBLIC_APP_URL` matches your dev server port
- Ensure admin user exists: `npm run db:seed`

**Error: "500 Internal Server Error"**
- Restart dev server after changing `.env.local`
- Check terminal for detailed error messages
- Verify database connection in `DATABASE_URL`
