"use client";

import { EditorialNav } from "@/components/EditorialNav";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MePage() {
  const [username, setUsername] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p: { username?: string }) => {
        if (p.username) {
          setUsername(p.username);
          setSaved(p.username);
        }
      });
  }, []);

  return (
    <>
      <EditorialNav name={saved || "GUEST"} />
      <main className="px-4 py-16 md:px-10">
        <p className="mono text-smoke">GUEST FIRST. ACCOUNT BAAD ME.</p>
        <h1 className="mt-4 font-serif text-[clamp(4rem,14vw,10rem)] leading-[0.8] tracking-[-0.06em]">
          NAAM RAKH LE?
        </h1>
        <form
          className="mt-10 max-w-md"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch("/api/profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username }),
            });
            const p = (await res.json()) as { username?: string };
            setSaved(p.username ?? username);
          }}
        >
          <input
            className="field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={16}
          />
          <button className="lock mt-6" type="submit">
            SAVE
          </button>
        </form>
        <p className="mt-16 max-w-sm text-smoke">
          Google aur magic-link tab chalenge jab Supabase keys lagengi. Abhi guest score local
          verified store pe jaata hai.
        </p>
        <div className="mt-10 flex gap-8 font-mono text-sm">
          <Link href="/daily">DAILY 5</Link>
          <Link href="/hard">HARD?</Link>
        </div>
      </main>
    </>
  );
}
