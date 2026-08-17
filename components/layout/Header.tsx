"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/guest-client";

const NAV = [
  { href: "/", label: "Daily" },
  { href: "/modes", label: "Modes" },
  { href: "/leaderboard", label: "Board" },
];

export function Header() {
  const path = usePathname();
  const [streak, setStreak] = useState(0);
  const home = path === "/";

  useEffect(() => {
    api<{ profile: { currentStreak: number } }>("/api/profile")
      .then((d) => setStreak(d.profile.currentStreak))
      .catch(() => {});
  }, [path]);

  return (
    <header className={`relative z-20 ${home ? "bg-transparent" : "border-b border-gold/30 bg-bg2/80"}`}>
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="min-w-0">
          {!home ? (
            <>
              <span className="devanagari block text-[22px] leading-none text-gold">बीट पहचान</span>
              <span className="display mt-1 block text-[11px] text-ink">BEAT PEHCHAAN</span>
            </>
          ) : (
            <span className="display text-[12px] text-mute">BEAT PEHCHAAN</span>
          )}
        </Link>
        <nav className="flex items-center gap-4 text-[12px] text-mute">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={path === item.href ? "text-gold" : "hover:text-ink"}>
              {item.label}
            </Link>
          ))}
          <span className="horn-pill">🔥 {streak}</span>
          <Link href="/profile" className="text-gold">
            Profile
          </Link>
        </nav>
      </div>
    </header>
  );
}
