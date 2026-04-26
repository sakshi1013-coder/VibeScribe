import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // In production, NEXT_PUBLIC_APP_URL must be set to your Vercel domain
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [usernameClient()],
});

export const { signIn, signOut, useSession } = authClient;
