import Link from "next/link";
import { ARTISTS } from "@/data/artists";
import { SCENE_TAGS } from "@/data/catalog";

export default function ModesPage() {
  const artists = ARTISTS.slice().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-3xl space-y-12 px-4 py-8">
      <div>
        <p className="mono text-[11px] tracking-[0.2em] text-mute">MODES</p>
        <h1 className="display mt-2 text-5xl">KAUNSA GAME?</h1>
      </div>

      <section className="space-y-3 border-b border-ink/10 pb-8">
        <p className="mono text-[10px] tracking-[0.18em] text-acid">THE MAIN EVENT</p>
        <h2 className="display text-3xl">DAILY BEAT</h2>
        <p className="max-w-md text-sm text-mute">
          Ek official track. Poori scene same beat. Kal naya.
        </p>
        <Link href="/" className="inline-flex h-11 items-center bg-acid px-5 text-[12px] tracking-[0.16em] text-bg">
          PLAY DAILY
        </Link>
      </section>

      <section className="space-y-3 border-b border-ink/10 pb-8">
        <h2 className="display text-3xl">UNLIMITED</h2>
        <p className="max-w-md text-sm text-mute">
          Random tracks. Run bana. Best run yaad rahega.
        </p>
        <Link href="/play/unlimited" className="inline-flex h-11 items-center border border-ink/20 px-5 text-[12px] tracking-[0.16em]">
          START RUN
        </Link>
      </section>

      <section className="space-y-3 border-b border-ink/10 pb-8">
        <p className="mono text-[10px] tracking-[0.18em] text-err">EGO CHECK.</p>
        <h2 className="display text-3xl">1 SECOND MODE</h2>
        <p className="max-w-md text-sm text-mute">
          Exactly one second. Extra audio nahi. 3 guesses. XP zyada.
        </p>
        <Link href="/play/one-second" className="inline-flex h-11 items-center border border-err px-5 text-[12px] tracking-[0.16em] text-err">
          TAKE THE L
        </Link>
      </section>

      <section className="space-y-4 border-b border-ink/10 pb-8">
        <h2 className="display text-3xl">ARTIST RUN</h2>
        <p className="max-w-md text-sm text-mute">Ek artist. Unke tracks. Catalog se, hardcoded nahi.</p>
        <ul className="flex flex-wrap gap-2">
          {artists.map((a) => (
            <li key={a.id}>
              <Link
                href={`/play/artist/${a.slug}`}
                className="inline-block border border-ink/15 px-3 py-2 text-sm hover:border-acid"
              >
                {a.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="display text-3xl">SCENE RUN</h2>
        <p className="max-w-md text-sm text-mute">
          Tags editable hain. Geography ko kachcha box mat samajh.
        </p>
        <ul className="flex flex-wrap gap-2">
          {SCENE_TAGS.map((tag) => (
            <li key={tag}>
              <Link
                href={`/play/scene/${encodeURIComponent(tag)}`}
                className="inline-block border border-ink/15 px-3 py-2 text-sm hover:border-acid"
              >
                {tag}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="pt-4">
        <p className="mono text-[10px] tracking-[0.18em] text-mute">COMING SOON</p>
        <p className="mt-2 text-sm text-mute">Album Mode · Head-to-Head · Private Friend Challenges · Timed Survival</p>
      </section>
    </div>
  );
}
