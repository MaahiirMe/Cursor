# DHHUH?

**SUNKE BATA.**

A music-recognition game for Indian Desi Hip-Hop. Five tracks. Five attempts each. Audio always starts at `00:00`.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Modes

- `/` Standard
- `/daily` Daily 5
- `/hard` 1-second first reveal
- `/how` Rules
- `/scores` Leaderboard
- `/me` Guest name
- `/admin/tracks` Catalogue

## Audio

Provider order: licensed preview → eligible official YouTube (IFrame API, `startSeconds: 0`) → mock intro (dev fallback). YouTube is only used when the catalogue marks the source as a faithful song beginning. No stream ripping.

## Persistence

Local JSON under `data/` until Supabase env is set. Schema: `supabase/schema.sql`.

Set `ADMIN_KEY` to lock the admin route. Set `SESSION_SECRET` in production.
