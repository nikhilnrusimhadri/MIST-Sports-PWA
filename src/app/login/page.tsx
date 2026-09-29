"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setError(error?.message || "Login failed");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      setError("No role assigned to this account.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (profile.role === "admin") {
      router.replace("/admin");
    } else if (profile.role === "scorer") {
      router.replace("/scorer");
    } else {
      setError("Invalid role.");
      await supabase.auth.signOut();
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#05050a] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">
            🏆
          </div>

          <p className="text-sm font-semibold tracking-[0.3em] text-blue-400">
            MIST SPORTS
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Welcome back
          </h1>

          <p className="mt-3 text-white/50">
            Official staff access
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
        >

          <label className="mb-2 block text-sm text-white/70">
            Email
          </label>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-5 h-13 w-full rounded-xl border border-white/10 bg-black/30 px-4 outline-none focus:border-blue-500"
            placeholder="you@example.com"
          />

          <label className="mb-2 block text-sm text-white/70">
            Password
          </label>

          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-5 h-13 w-full rounded-xl border border-white/10 bg-black/30 px-4 outline-none focus:border-blue-500"
            placeholder="••••••••"
          />

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-13 w-full rounded-xl bg-white font-bold text-black disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

        </form>

        <p className="mt-6 text-center text-xs text-white/30">
          MIST Sports Club • Official Event Platform
        </p>

      </div>
    </main>
  );
}