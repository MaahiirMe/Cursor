export type SceneTag =
  | "Delhi"
  | "Mumbai"
  | "Pakistan"
  | "Underground"
  | "Mainstream"
  | "Old School"
  | "New Wave";

export type LanguageTag = "Hindi" | "Punjabi" | "English" | "Hinglish" | "Urdu";

export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type GameMode =
  | "daily"
  | "unlimited"
  | "one-second"
  | "artist-run"
  | "scene-run";

export interface Artist {
  id: string;
  name: string;
  slug: string;
  aliases: string[];
  imageUrl: string;
  sceneTags: SceneTag[];
}

export interface Track {
  id: string;
  title: string;
  slug: string;
  artists: string[];
  primaryArtist: string;
  featuredArtists: string[];
  aliases: string[];
  album: string;
  artworkUrl: string;
  previewUrl: string;
  waveformData: number[];
  releaseYear: number;
  sceneTags: SceneTag[];
  languageTags: LanguageTag[];
  difficulty: Difficulty;
  active: boolean;
  audioSeed: number;
}

export interface DailyChallenge {
  id: string;
  date: string;
  challengeNumber: number;
  trackId: string;
  difficulty: Difficulty;
}

export interface DailyChallengePublic {
  id: string;
  date: string;
  challengeNumber: number;
  difficulty: Difficulty;
  playerCount: number;
  averageGuessDuration: number;
  successRate: number;
  fastestVerified: number;
}

export interface CatalogSong {
  id: string;
  title: string;
  album: string;
  aliases: string[];
  primaryArtistName: string;
  artistIds: string[];
}

export interface CatalogArtist {
  id: string;
  name: string;
  aliases: string[];
}

export interface GuessInput {
  songId?: string;
  artistId?: string;
  songText: string;
  artistText: string;
}

export interface Guess {
  challengeId: string;
  userId: string;
  songGuess: string;
  artistGuess: string;
  songCorrect: boolean;
  artistCorrect: boolean;
  artistPartial: boolean;
  revealDuration: number;
  attempt: number;
}

export type GuessVerdict =
  | "full"
  | "artist-only"
  | "song-only"
  | "song-artist-variation"
  | "miss";

export interface GuessFeedback {
  verdict: GuessVerdict;
  message: string;
  songCorrect: boolean;
  artistCorrect: boolean;
  artistPartial: boolean;
  attemptsLeft: number;
  scoreDelta: number;
}

export interface GameResult {
  userId: string;
  mode: GameMode;
  trackId: string;
  challengeId?: string;
  score: number;
  attempts: number;
  revealDuration: number;
  correct: boolean;
  completedAt: string;
  practice?: boolean;
  xp: number;
}

export interface RevealedTrack {
  id: string;
  title: string;
  artists: string[];
  primaryArtist: string;
  featuredArtists: string[];
  album: string;
  artworkUrl: string;
  releaseYear: number;
}

export interface RankDef {
  id: string;
  name: string;
  minXp: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  blurb: string;
  stamp: "pass" | "cassette" | "stamp";
}

export interface PlayerProfile {
  userId: string;
  username: string;
  avatarSeed: string;
  xp: number;
  rankId: string;
  currentStreak: number;
  longestStreak: number;
  songsAttempted: number;
  songsGuessed: number;
  accuracy: number;
  averageRevealDuration: number;
  averageAttempts: number;
  perfectTwoSecondGuesses: number;
  favouriteMode: GameMode | null;
  bestScene: SceneTag | null;
  dna: { tag: SceneTag; value: number }[] | null;
  achievements: string[];
}

export interface LeaderboardRow {
  rank: number;
  userId: string;
  username: string;
  score: number;
  averageRevealTime: number;
  accuracy: number;
  streak: number;
}

export interface AudioPreview {
  trackId: string;
  objectUrl: string;
  duration: number;
}

export interface ModeConfig {
  mode: GameMode;
  maxAttempts: number;
  reveals: number[];
  xpMultiplier: number;
  allowExtend: boolean;
}
