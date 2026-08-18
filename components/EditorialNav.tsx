"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Identity } from "@/lib/identity";

const links = [
  { href: "/", label: "PLAY" },
  { href: "/how", label: "HOW?" },
  { href: "/scores", label: "SCORES" },
];

export function EditorialNav({
  sessionLabel,
  identity,
  score,
  roundIndex,
  onLogout,
}: {
  sessionLabel?: string;
  identity?: Identity | null;
  score?: number;
  roundIndex?: number;
  onLogout?: () => void;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const label =
    identity?.kind === "registered"
      ? identity.username
      : identity?.kind === "guest"
        ? `GUEST · ${identity.displayName}`
        : "GUEST";

  return (
    <header className="grid grid-cols-12 items-start gap-2 px-4 pt-5 md:px-8">
      <Link href="/" className="col-span-3 md:col-span-2">
        <div className="font-serif text-[1.35rem] leading-none tracking-tight text-orange">
          DHHUH?
        </div>
        <div className="mono mt-2 text-smoke">• Indian Desi Hip-Hop only</div>
      </Link>
      <nav className="col-span-5 flex justify-center gap-6 pt-1 text-[0.72rem] tracking-[0.22em] md:col-span-6">
        {links.map((l) => {
          const active = path === l.href || (l.href !== "/" && path.startsWith(l.href));
          return (
            <Link key={l.href} href={l.href} className="relative">
              {l.label}
              {active ? (
                <span className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-orange" />
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="relative col-span-4 flex flex-col items-end gap-1 md:col-span-4">
        <button type="button" className="mono text-right" onClick={() => setOpen((v) => !v)}>
          {label} ▾
        </button>
        {typeof score === "number" ? (
          <div className="mono text-orange">{score.toLocaleString("en-IN")} PTS</div>
        ) : null}
        {typeof roundIndex === "number" ? (
          <div className="mono text-smoke">{String(roundIndex + 1).padStart(2, "0")} / 05</div>
        ) : sessionLabel ? (
          <div className="mono text-smoke">{sessionLabel}</div>
        ) : null}
        {open ? (
          <div className="absolute right-0 top-7 z-40 min-w-[10rem] bg-ink py-3">
            <Link href="/me" className="mono block py-1 text-right" onClick={() => setOpen(false)}>
              PROFILE
            </Link>
            {identity?.kind === "guest" ? (
              <Link href="/me" className="mono block py-1 text-right text-smoke" onClick={() => setOpen(false)}>
                SAVE THIS NAME
              </Link>
            ) : null}
            {onLogout ? (
              <button type="button" className="mono block w-full py-1 text-right" onClick={onLogout}>
                LOG OUT
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
