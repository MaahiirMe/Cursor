"use client";

import { useState } from "react";
import type { Identity } from "@/lib/identity";

export function IdentityGate({
  onReady,
}: {
  onReady: (identity: Identity) => void;
}) {
  const [mode, setMode] = useState<"pick" | "guest" | "login">("pick");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function guest() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = (await res.json()) as { identity?: Identity; error?: string };
      if (!res.ok || !json.identity) throw new Error(json.error ?? "fail");
      localStorage.setItem("dhhuh_guest_name", json.identity.kind === "guest" ? json.identity.displayName : name);
      onReady(json.identity);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function checkName(value: string) {
    if (value.trim().length < 2) return;
    const res = await fetch(`/api/auth/available?username=${encodeURIComponent(value)}`);
    const json = (await res.json()) as { available: boolean; message: string; suggestions?: string[] };
    setMessage(json.message);
    setSuggestions(json.suggestions ?? []);
  }

  async function auth(kind: "login" | "register") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(kind === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = (await res.json()) as {
        identity?: Identity;
        error?: string;
        message?: string;
        suggestions?: string[];
      };
      if (!res.ok || !json.identity) {
        setSuggestions(json.suggestions ?? []);
        throw new Error(json.error ?? "fail");
      }
      localStorage.removeItem("dhhuh_guest_name");
      onReady(json.identity);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-md">
        <p className="mono text-smoke">INDIAN DESI HIP-HOP</p>
        <h1 className="mt-3 font-serif text-[clamp(4rem,16vw,8rem)] leading-[0.8] tracking-[-0.06em]">
          DHHUH<span className="text-orange">?</span>
        </h1>
        <p className="tagline mt-4">SUNKE BATA.</p>

        {mode === "pick" ? (
          <div className="mt-12 flex flex-col gap-4">
            <button type="button" className="lock w-full" onClick={() => setMode("login")}>
              LOGIN
            </button>
            <button type="button" className="skip-link text-left" onClick={() => setMode("guest")}>
              PLAY AS GUEST
            </button>
          </div>
        ) : null}

        {mode === "guest" ? (
          <form
            className="mt-12"
            onSubmit={(e) => {
              e.preventDefault();
              guest();
            }}
          >
            <p className="font-serif text-3xl">Naam kya hai?</p>
            <input
              className="field mt-6"
              value={name}
              autoFocus
              maxLength={16}
              placeholder="Enter your name"
              onChange={(e) => setName(e.target.value)}
            />
            <button className="lock mt-8" type="submit" disabled={busy || name.trim().length < 2}>
              SUNKE BATA →
            </button>
            <button type="button" className="mono mt-6 block text-smoke" onClick={() => setMode("pick")}>
              ← BACK
            </button>
          </form>
        ) : null}

        {mode === "login" ? (
          <form
            className="mt-12"
            onSubmit={(e) => {
              e.preventDefault();
              auth("login");
            }}
          >
            <label className="mono text-smoke">USERNAME</label>
            <input
              className="field"
              value={username}
              autoComplete="username"
              maxLength={16}
              onChange={(e) => {
                setUsername(e.target.value);
                checkName(e.target.value);
              }}
            />
            <label className="mono mt-6 block text-smoke">PASSWORD</label>
            <input
              className="field"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="mt-4 max-w-sm text-sm text-smoke">
              Username yaad rakhna. Yahan hints nahi milenge.
            </p>
            {message ? <p className="mt-4 font-serif text-2xl">{message}</p> : null}
            {suggestions.length ? (
              <p className="mono mt-2 text-smoke">TRY {suggestions.join(" / ")}</p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-4">
              <button className="lock" type="submit" disabled={busy}>
                LOGIN
              </button>
              <button
                className="skip-link"
                type="button"
                disabled={busy}
                onClick={() => auth("register")}
              >
                CREATE USERNAME
              </button>
            </div>
            <button type="button" className="mono mt-6 block text-smoke" onClick={() => setMode("pick")}>
              ← BACK
            </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
