
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Eye, EyeOff, LockKeyhole } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Please try again.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#070B14] px-5 py-10 text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-9">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10">
            <span className="text-4xl font-black text-cyan-400">K</span>
          </div>

          <p className="text-xs font-bold tracking-[0.35em] text-cyan-400">
            KRIYALAYA
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Admin Portal
          </h1>

          <p className="mt-2 text-sm text-[#81796E]">
            Secure institutional administration
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-3xl border border-[#E5DEC9] bg-[#111827] p-7 shadow-2xl sm:p-9"
        >
          <div className="mb-7 flex items-center gap-3">
            <ShieldCheck className="text-cyan-400" size={25} />
            <div>
              <h2 className="font-semibold">Administrator Login</h2>
              <p className="text-xs text-[#81796E]">
                Enter your master password to continue
              </p>
            </div>
          </div>

          <label className="mb-2 block text-sm text-[#2B1E1F]">
            Master Password
          </label>

          <div className="relative">
            <LockKeyhole
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />

            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter admin password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-[#E5DEC9] bg-[#080E1A] py-4 pl-12 pr-12 text-white outline-none transition focus:border-cyan-400"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#81796E] hover:text-cyan-400"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="mt-7 flex w-full items-center justify-center rounded-xl bg-cyan-400 py-4 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Secure Admin Login"}
          </button>

          <p className="mt-6 text-center text-xs text-slate-500">
            <LockKeyhole size={12} className="mr-1 inline" />
            Protected KRIYALAYA administration access
          </p>
        </form>

        <p className="mt-8 text-center text-xs text-slate-600">
          KRIYALAYA — Omnia Fluentia. Connect. Coordinate. Create.
        </p>
      </div>
    </main>
  );
}
