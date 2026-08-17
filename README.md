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

Do not drop copyrighted files into the repo. Swap `lib/audio/mock-provider.ts` for a licensed preview provider that implements `AudioProvider`.
