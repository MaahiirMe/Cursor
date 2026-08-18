"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "PLAY" },
  { href: "/how", label: "HOW?" },
  { href: "/scores", label: "SCORES" },
];

export function EditorialNav({
  sessionLabel,
  name,
}: {
  sessionLabel?: string;
  name?: string;
}) {
  const path = usePathname();
  return (
    <header className="grid grid-cols-12 items-start gap-2 px-4 pt-5 md:px-8">
      <Link href="/" className="col-span-3 md:col-span-2">
        <div className="font-serif text-[1.35rem] leading-none tracking-tight text-orange">
          DHHUH?
        </div>
        <div className="mono mt-2 text-smoke">• Indian Desi Hip-Hop only</div>
      </Link>
      <nav className="col-span-6 flex justify-center gap-6 pt-1 text-[0.72rem] tracking-[0.22em] md:col-span-7">
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
      <div className="col-span-3 flex flex-col items-end gap-2 md:col-span-3">
        <Link href="/me" className="mono text-right">
          {name ?? "MC NAYA"} ▾
        </Link>
        {sessionLabel ? <div className="mono text-smoke">{sessionLabel}</div> : null}
      </div>
    </header>
  );
}
