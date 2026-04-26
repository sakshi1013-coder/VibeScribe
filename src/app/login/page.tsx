"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { LogIn, User, Lock, AlertCircle, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await signIn.username({
        username,
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8 lg:p-10 shadow-2xl border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-iris"></div>

          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-iris text-white shadow-xl">
              <Zap size={40} fill="white" />
            </div>

            <h1 className="text-4xl font-black tracking-tight text-lace">VibeScribe</h1>
            <p className="mt-3 text-lace/40 text-xs font-bold uppercase tracking-[0.3em]">Elevated Intelligence</p>
          </div>



          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Username</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-4 pl-12 pr-4 text-lace placeholder-lace/20 outline-none transition-all focus:border-iris/50 focus:bg-white/10"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>


            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-4 pl-12 pr-4 text-lace placeholder-lace/20 outline-none transition-all focus:border-iris/50 focus:bg-white/10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>


            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl btn-iris py-4 font-black text-white transition-all active:scale-[0.98] disabled:opacity-50"
            >

              <span className="relative flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 size={20} />
                  </motion.div>
                ) : (
                  <>
                    Access Matrix
                    <LogIn size={18} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </button>


          </form>

          <p className="mt-10 text-center text-[10px] font-black tracking-[0.4em] text-lace/20 uppercase">
            VibeScribe v2.0 • Intelligence Redefined
          </p>


        </div>
      </motion.div>
    </div>
  );
}
