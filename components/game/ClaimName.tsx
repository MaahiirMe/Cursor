"use client";

import { useState } from "react";
import { api } from "@/lib/guest-client";

export function ClaimName({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await api("/api/claim", { method: "POST", body: JSON.stringify({ username: name }) });
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-ink/15 bg-bg2 p-4">
      <p className="display text-2xl">Score save karna hai?</p>
      <p className="mt-2 text-sm text-mute">Naam claim kar. Login baad mein.</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="username"
        className="mt-4 h-12 w-full border border-ink/20 bg-bg px-3 text-base"
      />
      {err ? <p className="mt-2 text-sm text-err">{err}</p> : null}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="h-11 flex-1 bg-acid text-[12px] tracking-[0.16em] text-bg"
        >
          CLAIM YOUR NAME
        </button>
        <button type="button" onClick={onDone} className="h-11 flex-1 border border-ink/20 text-[12px]">
          NOT NOW
        </button>
      </div>
    </div>
  );
}
