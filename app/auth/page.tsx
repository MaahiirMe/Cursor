"use client";

import { useState } from "react";
import { createSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const configured = isSupabaseConfigured();

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="display text-4xl">CLAIM YOUR NAME</h1>
      <p className="mt-3 text-sm text-mute">
        Game ke baad. Pehle sun, pehle guess. Account optional hai.
      </p>
      {configured ? (
        <form
          className="mt-8 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const sb = createSupabaseBrowser();
            if (!sb) return;
            const { error } = await sb.auth.signInWithOtp({ email });
            setMsg(error ? error.message : "Mail check kar. Link aa gaya.");
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full border border-ink/20 bg-bg2 px-3"
            placeholder="email"
          />
          <button type="submit" className="h-11 w-full bg-acid text-[12px] tracking-[0.16em] text-bg">
            SEND LINK
          </button>
        </form>
      ) : (
        <p className="mt-8 text-sm text-mute">
          Supabase keys nahi mili. Local naam profile page se claim ho jaata hai. Guest history isi device
          par rehti hai.
        </p>
      )}
      {msg ? <p className="mt-4 text-sm">{msg}</p> : null}
    </div>
  );
}
