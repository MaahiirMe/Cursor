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

  useEffect(() => {
    api<{ profile: { currentStreak: number } }>("/api/profile")
      .then((d) => setStreak(d.profile.currentStreak))
      .catch(() => {});
  }, [path]);

  return (
    <header className="relative z-20 border-b-2 border-gold/40 bg-bg2/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="min-w-0">
          <span className="devanagari block text-[22px] leading-none text-gold sm:text-[28px]">
            बीट पहचान
          </span>
          <span className="display mt-1 block text-[11px] tracking-[0.18em] text-ink sm:text-xs">
            BEAT PEHCHAAN
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-[13px] text-mute md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={path === item.href ? "text-gold" : "hover:text-ink"}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-[12px]">
          <span className="horn-pill" aria-label={`${streak} day streak`}>
            🔥 {streak} STREAK
          </span>
          <Link href="/profile" className="border border-gold/40 px-2 py-1 text-gold hover:bg-gold hover:text-bg">
            Profile
          </Link>
        </div>
      </div>
      <nav className="flex justify-center gap-5 border-t border-gold/20 py-2 text-[12px] text-mute md:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={path === item.href ? "text-gold" : ""}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
