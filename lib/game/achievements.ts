import type { AchievementDef, GameResult } from "@/types";

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "beat-se-pehchaan",
    name: "BEAT SE PEHCHAAN",
    blurb: "Pehla gaana 2 second mein pakda.",
    stamp: "pass",
  },
  {
    id: "no-lyrics",
    name: "NO LYRICS NEEDED",
    blurb: "20 tracks, vocals se pehle.",
    stamp: "cassette",
  },
  {
    id: "clean-sweep",
    name: "CLEAN SWEEP",
    blurb: "5 sahi guesses, back to back.",
    stamp: "stamp",
  },
  {
    id: "daily-duty",
    name: "DAILY DUTY",
    blurb: "7 din Daily Beat streak.",
    stamp: "pass",
  },
  {
    id: "scene-student",
    name: "SCENE STUDENT",
    blurb: "100 alag songs try kiye.",
    stamp: "cassette",
  },
  {
    id: "aux-privileges",
    name: "AUX PRIVILEGES",
    blurb: "50 tracks, 80%+ accuracy.",
    stamp: "stamp",
  },
];

export function unlockAchievements(params: {
  results: GameResult[];
  currentStreak: number;
  already: string[];
}): string[] {
  const { results, currentStreak, already } = params;
  const unlocked = new Set(already);
  const official = results.filter((r) => !r.practice);
  const guessed = official.filter((r) => r.correct);
  const uniqueTried = new Set(official.map((r) => r.trackId)).size;

  if (guessed.some((r) => r.revealDuration <= 2 && r.attempts === 1)) {
    unlocked.add("beat-se-pehchaan");
  }
  if (guessed.filter((r) => r.revealDuration <= 7).length >= 20) {
    unlocked.add("no-lyrics");
  }
  let run = 0;
  let best = 0;
  for (const r of official) {
    if (r.correct) {
      run += 1;
      best = Math.max(best, run);
    } else run = 0;
  }
  if (best >= 5) unlocked.add("clean-sweep");
  if (currentStreak >= 7) unlocked.add("daily-duty");
  if (uniqueTried >= 100) unlocked.add("scene-student");
  if (official.length >= 50) {
    const acc = guessed.length / official.length;
    if (acc >= 0.8) unlocked.add("aux-privileges");
  }
  return [...unlocked];
}
