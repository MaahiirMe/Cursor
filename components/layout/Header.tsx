"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/guest-client";

const NAV = [
  { href: "/", label: "Daily" },
  { href: "/modes", label: "Modes" },
  { href: "/leaderboard", label: "Leaderboard" },
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
    <header className="relative z-20 border-b border-ink/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="display text-[15px] tracking-wide sm:text-lg">
          BEAT PEHCHAAN
        </Link>
        <nav className="hidden items-center gap-6 text-[13px] text-mute md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={path === item.href ? "text-ink" : "hover:text-ink"}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-[12px]">
          <span className="mono text-mute" aria-label={`${streak} day streak`}>
            🔥 {streak}
          </span>
          <Link href="/profile" className="border border-ink/20 px-2 py-1 hover:border-acid">
            Profile
          </Link>
        </div>
      </div>
      <nav className="flex justify-center gap-5 border-t border-ink/10 py-2 text-[12px] text-mute md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={path === item.href ? "text-ink" : ""}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
