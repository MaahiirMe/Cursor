export type PlayerStats = {
  sessions: number;
  tracksAttempted: number;
  correct: number;
  accuracy: number;
  totalScore: number;
  bestScore: number;
  averageListen: number | null;
  perfectTwoSecond: number;
  streak: number;
  bestStreak: number;
};

export type Identity =
  | { kind: "registered"; id: string; username: string; stats: PlayerStats }
  | { kind: "guest"; displayName: string };
