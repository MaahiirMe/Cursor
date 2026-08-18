export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type Artist = {
  id: string;
  name: string;
  normalizedName: string;
  aliases: string[];
  country: "IN" | "PK";
  sceneTags: string[];
  active: boolean;
};

export type ArtistReference = {
  id: string;
  name: string;
  role?: "primary" | "feature" | "group";
};

export type Track = {
  id: string;
  title: string;
  normalizedTitle: string;
  artists: ArtistReference[];
  primaryArtistId: string;
  aliases: string[];
  album?: string;
  releaseYear?: number;
  artworkUrl?: string;
  youtubeVideoId?: string;
  youtubeStartFaithful?: boolean;
  licensedPreviewUrl?: string;
  licensedPreviewStart?: number;
  sourcePlaylists: string[];
  country: "IN";
  genre: "DHH";
  sceneTags: string[];
  difficulty: Difficulty;
  active: boolean;
  introQuality: "faithful" | "uncertain" | "unusable";
  hints?: [string, string, string];
};

export type GameMode = "standard" | "daily" | "hard";

export type RoundOutcome = "pending" | "correct" | "failed" | "skipped";

export type GuessVerdict =
  | "FULL_CORRECT"
  | "ARTIST_ONLY"
  | "WRONG"
  | "LAST_HAI";

export type SafePlayback = {
  providerId: string;
  youtubeVideoId?: string;
  audioUrl?: string;
  startSeconds: 0;
};

export type SafeRound = {
  index: number;
  attemptsLeft: number;
  attemptsUsed: number;
  maxAttempts: 5;
  revealSeconds: number;
  initialSeconds: number;
  possibleScore: number;
  outcome: RoundOutcome;
  playback: SafePlayback;
  score?: number;
  copy?: string;
  purchasedHints: PurchasedHint[];
  nextHintCost: number | null;
  canAddTime: boolean;
};

export type PurchasedHint = {
  index: number;
  text: string;
  cost: number;
};

export type RevealedRound = SafeRound & {
  title?: string;
  artistNames?: string[];
  artworkUrl?: string;
  artworkSeed?: string;
};

export type SessionPublic = {
  id: string;
  number: number;
  mode: GameMode;
  currentIndex: number;
  rounds: RevealedRound[];
  totalScore: number;
  status: "playing" | "complete";
  dailyKey?: string;
  replay?: boolean;
  resultCopy?: string;
  stats?: SessionStats;
};

export type SessionStats = {
  solved: number;
  firstTry: number;
  averageReveal: number | null;
  bestTrackIndex: number | null;
};

export type StoredRound = {
  trackId: string;
  attemptsUsed: number;
  revealSeconds: number;
  initialSeconds: number;
  hintsPurchased: number;
  replacements: number;
  outcome: RoundOutcome;
  score: number;
  guesses: StoredGuess[];
  prepared?: {
    providerId: string;
    youtubeVideoId?: string;
    audioUrl?: string;
    startSeconds: 0;
  };
};

export type StoredGuess = {
  trackId: string;
  artistId: string;
  verdict: GuessVerdict;
  at: number;
};

export type StoredSession = {
  id: string;
  number: number;
  mode: GameMode;
  playerId: string;
  createdAt: number;
  currentIndex: number;
  rounds: StoredRound[];
  status: "playing" | "complete";
  dailyKey?: string;
  replay?: boolean;
};

export type SearchHit = {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  local?: boolean;
  artistId?: string;
  artistIds?: string[];
  highlight: [number, number] | null;
};
