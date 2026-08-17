# Beat Pehchaan

**Pehchaan beat se.** Lyrics ke bina gaana pehchaan ke dikha.

A mobile-first Desi Hip-Hop beat-guessing game. Daily Beat is the homepage. Play in a few seconds.

## Stack

- Next.js 16 + TypeScript + Tailwind CSS
- Supabase-ready (Auth / Postgres / RLS) with a local store fallback
- Original placeholder instrumentals via `MockAudioProvider` — no commercial recordings bundled

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Daily challenge

Reset timezone is **Asia/Kolkata** (`lib/config.ts`). Challenge #1 is `2026-07-22`, so 17 Aug 2026 is **#027**.

## Supabase (optional)

Copy `.env.example` and set URL + anon key. Apply `lib/supabase/schema.sql`. Without keys, guest play still works: scores are validated on the server and stored in `.data/store.json`.

## Audio

Live playback uses **official 30-second previews** from Apple Music Search / Deezer — not ripped files, not full songs. The game clips that preview to 2–16 seconds. If a preview is missing, a generated placeholder beat is used.
