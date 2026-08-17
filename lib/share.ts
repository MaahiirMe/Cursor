import { SITE } from "@/lib/config";

export function shareText(params: {
  challengeNumber: number;
  revealDuration: number;
  songCorrect: boolean;
  artistCorrect: boolean;
  attempts: number;
  maxAttempts: number;
  streak: number;
  score: number;
  won: boolean;
}) {
  const n = String(params.challengeNumber).padStart(3, "0");
  const lines = [
    `BEAT PEHCHAAN #${n}`,
    "",
    `🎧 ${params.revealDuration} SEC`,
    `${params.songCorrect ? "🟩" : "🟥"} SONG`,
    `${params.artistCorrect ? "🟩" : "🟥"} ARTIST`,
    "",
    `🎯 ${params.won ? params.attempts : "X"}/${params.maxAttempts}`,
    params.streak ? `🔥 ${params.streak} DAY STREAK` : "",
    "",
    params.won ? `**${params.score} PTS**` : "AAJ SCENE NE HARA DIYA.",
    "",
    SITE.domain,
  ];
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
}

export function ordinalAttempt(n: number) {
  const labels = ["1st", "2nd", "3rd", "4th", "5th"];
  return `${labels[n - 1] ?? `${n}th`} attempt`;
}
