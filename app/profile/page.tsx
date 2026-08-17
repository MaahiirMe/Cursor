"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ACHIEVEMENTS } from "@/lib/game/achievements";
import { RANKS, rankProgress } from "@/lib/game/ranks";
import { api } from "@/lib/guest-client";
import type { PlayerProfile } from "@/types";

export default function ProfilePage() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  const load = () =>
    api<{ profile: PlayerProfile; claimed: boolean }>("/api/profile").then((d) => {
      setProfile(d.profile);
      setClaimed(d.claimed);
    });

  useEffect(() => {
    void load().catch(() => {});
  }, []);

  if (!profile) {
    return <p className="mono px-4 py-16 text-[12px] tracking-[0.2em] text-mute">BEAT LOAD HO RAHI HAI...</p>;
  }

  const progress = rankProgress(profile.xp);
  const rankName = RANKS.find((r) => r.id === profile.rankId)?.name ?? progress.rank.name;

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      <section className="border border-ink/15 p-5">
        <p className="mono text-[10px] tracking-[0.2em] text-mute">PLAYER CARD</p>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="display text-4xl">{profile.username}</h1>
            <p className="mt-2 text-sm text-acid">{rankName}</p>
          </div>
          <Avatar seed={profile.avatarSeed} />
        </div>
        <div className="mt-6">
          <div className="flex justify-between text-[11px] text-mute">
            <span>XP {profile.xp}</span>
            <span>{progress.next ? progress.next.name : "MAX"}</span>
          </div>
          <div className="mt-2 h-1 bg-ink/10">
            <div className="h-1 bg-acid" style={{ width: `${Math.round(progress.pct * 100)}%` }} />
          </div>
        </div>
      </section>

      {!claimed ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            api("/api/claim", { method: "POST", body: JSON.stringify({ username: name }) })
              .then(() => {
                setMsg("Naam lock.");
                void load();
              })
              .catch((err) => setMsg(err instanceof Error ? err.message : "Try again"));
          }}
        >
          <p className="text-sm">Score save karna hai?</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 w-full border border-ink/20 bg-bg2 px-3"
            placeholder="username"
          />
          <button type="submit" className="h-11 bg-acid px-5 text-[12px] tracking-[0.16em] text-bg">
            CLAIM YOUR NAME
          </button>
          {msg ? <p className="text-sm text-mute">{msg}</p> : null}
        </form>
      ) : null}

      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <Stat k="Streak" v={`${profile.currentStreak}`} />
        <Stat k="Longest" v={`${profile.longestStreak}`} />
        <Stat k="Attempted" v={`${profile.songsAttempted}`} />
        <Stat k="Guessed" v={`${profile.songsGuessed}`} />
        <Stat k="Accuracy" v={`${Math.round(profile.accuracy * 100)}%`} />
        <Stat k="Avg reveal" v={`${profile.averageRevealDuration.toFixed(1)}s`} />
        <Stat k="Avg attempts" v={`${profile.averageAttempts.toFixed(1)}`} />
        <Stat k="Perfect 2s" v={`${profile.perfectTwoSecondGuesses}`} />
        <Stat k="Favourite" v={profile.favouriteMode ?? "—"} />
      </dl>

      <section>
        <h2 className="display text-3xl">YOUR DHH DNA</h2>
        {profile.dna && profile.dna.length ? (
          <ul className="mt-4 space-y-2">
            {profile.dna.map((d) => (
              <li key={d.tag} className="flex items-center gap-3 text-sm">
                <span className="w-28 text-mute">{d.tag}</span>
                <span className="h-1 flex-1 bg-ink/10">
                  <span className="block h-1 bg-ink" style={{ width: `${d.value}%` }} />
                </span>
                <span className="mono w-10 text-right">{d.value}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 max-w-md text-sm text-mute">
            Abhi data kam hai. DNA tab dikhega jab kaafi games khel chuke hoge. Taste assume nahi karte.
          </p>
        )}
      </section>

      <section>
        <h2 className="display text-3xl">PASSES</h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a) => {
            const on = profile.achievements.includes(a.id);
            return (
              <li
                key={a.id}
                className={`rotate-[-1.2deg] border px-4 py-4 ${on ? "border-acid" : "border-ink/15 opacity-50"}`}
              >
                <p className="mono text-[10px] tracking-[0.2em]">{a.stamp.toUpperCase()}</p>
                <p className="display mt-2 text-xl">{a.name}</p>
                <p className="mt-1 text-sm text-mute">{a.blurb}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-sm text-mute">
        Account link karna hai? <Link href="/auth">Auth</Link>
      </p>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="mono text-[10px] tracking-[0.16em] text-mute">{k}</dt>
      <dd className="mt-1 text-lg">{v}</dd>
    </div>
  );
}

function Avatar({ seed }: { seed: string }) {
  const h = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <div
      className="h-16 w-16 border border-ink/20"
      aria-hidden
      style={{
        background: `repeating-linear-gradient(${h % 90}deg, #111 0 8px, #c8ff00 8px 10px, #111 10px 18px)`,
      }}
    />
  );
}
