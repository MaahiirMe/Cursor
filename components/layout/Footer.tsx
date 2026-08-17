import Link from "next/link";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "Kaise khele" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
  { href: "https://instagram.com/beatpehchaan", label: "Instagram", ext: true },
  { href: "https://x.com/beatpehchaan", label: "X", ext: true },
];

export function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t-2 border-gold/30 bg-bg2">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
        <p className="horn-pill w-fit">HORN OK PLEASE</p>
        <p className="max-w-lg text-[13px] text-mute">
          Made for people who say “bhai beat se hi pata chal gaya tha.”
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-mute">
          {LINKS.map((l) =>
            l.ext ? (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ),
          )}
        </div>
      </div>
    </footer>
  );
}
