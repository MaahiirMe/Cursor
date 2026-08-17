"use client";

import { useEffect, useMemo, useState } from "react";
import { BeatPlayer } from "@/components/audio/BeatPlayer";
import { AttemptPips } from "@/components/game/AttemptPips";
import { ClaimName } from "@/components/game/ClaimName";
import { FailPanel } from "@/components/game/FailPanel";
import { ResultPanel } from "@/components/game/ResultPanel";
import { SearchField } from "@/components/search/SearchField";
import { ShareActions } from "@/components/share/ShareActions";
import { NightBus } from "@/components/visual/NightBus";
import { MarqueeFrame } from "@/components/visual/MarqueeFrame";
import { api } from "@/lib/guest-client";
import { nextReveal } from "@/lib/scoring";
import { shareText } from "@/lib/share";
import type { GameMode, GameResult, RevealedTrack } from "@/types";

export type PublicBeat = {
  id: string;
  waveformData: number[];
  difficulty: number;
  audioSeed: number;
};

type GuessResponse = {
  verdict: string;
  message: string;
  songCorrect: boolean;
  artistCorrect: boolean;
  attemptsLeft: number;
  scoreDelta: number;
  finished: boolean;
  correct: boolean;
  result: GameResult | null;
  reveal: RevealedTrack | null;
  showClaim: boolean;
  streak: number;
  fasterThan: number | null;
  failStat: { pool: number; missPct: number } | null;
};

type Props = {
  mode: GameMode;
  eyebrow: string;
  headline: string;
  track: PublicBeat;
  challengeId?: string;
  challengeNumber?: number;
  maxAttempts: number;
  initialUnlock: number;
  allowExtend: boolean;
  practice?: boolean;
  filterArtistId?: string;
  filterScene?: string;
  onNext?: () => void;
  daily?: boolean;
};

export function GameScreen({
  mode,
  eyebrow,
  headline,
  track,
  challengeId,
  challengeNumber = 0,
  maxAttempts,
  initialUnlock,
  allowExtend,
  practice,
  filterArtistId,
  filterScene,
  onNext,
  daily,
}: Props) {
  const [unlock, setUnlock] = useState(initialUnlock);
  const [attempt, setAttempt] = useState(1);
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [songId, setSongId] = useState<string>();
  const [artistId, setArtistId] = useState<string>();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [finished, setFinished] = useState<GuessResponse | null>(null);
  const [claim, setClaim] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const attemptsUsed = attempt - 1;
  const attemptsLeft = finished ? finished.attemptsLeft : maxAttempts - attemptsUsed;

  const share = useMemo(() => {
    if (!finished?.result) return "";
    return shareText({
      challengeNumber,
      revealDuration: finished.result.revealDuration,
      songCorrect: finished.songCorrect,
      artistCorrect: finished.artistCorrect,
      attempts: finished.result.attempts,
      maxAttempts,
      streak: finished.streak,
      score: finished.result.score,
      won: finished.correct,
    });
  }, [finished, challengeNumber, maxAttempts]);

  const lock = async () => {
    if (!song.trim() || !artist.trim()) {
      setFeedback("Song + artist dono lock kar.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await api<GuessResponse>("/api/guess", {
        method: "POST",
        body: JSON.stringify({
          mode,
          playId: track.id,
          challengeId,
          songText: song,
          artistText: artist,
          songId,
          artistId,
          revealDuration: unlock,
          attempt,
          practice,
          filterArtistId,
          filterScene,
        }),
      });
      setFeedback(`${res.message}${res.scoreDelta ? `  ${res.scoreDelta}` : ""}`);
      if (res.finished) {
        setFinished(res);
        setClaim(res.showClaim);
      } else {
        setAttempt((n) => n + 1);
        setSong("");
        setArtist("");
        setSongId(undefined);
        setArtistId(undefined);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "NETWORK GAYA. SCORE NAHI.");
    } finally {
      setBusy(false);
    }
  };

  const more = () => {
    const n = nextReveal(unlock);
    if (n) setUnlock(n);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        void lock();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (finished?.correct && finished.reveal && finished.result) {
    return (
      <div className="space-y-8">
        <ResultPanel
          track={finished.reveal}
          attempts={finished.result.attempts}
          revealDuration={finished.result.revealDuration}
          score={finished.result.score}
          streak={finished.streak}
          fasterThan={finished.fasterThan}
          daily={daily && !practice}
          practice={practice}
          onShare={() => setShareOpen(true)}
          onNext={onNext}
        />
        {shareOpen ? (
          <ShareActions
            text={share}
            title="Beat Pehchaan"
            score={finished.result.score}
            challenge={`#${String(challengeNumber).padStart(3, "0")}`}
          />
        ) : null}
        {claim ? <ClaimName onDone={() => setClaim(false)} /> : null}
      </div>
    );
  }

  if (finished && !finished.correct && finished.reveal) {
    return (
      <div className="space-y-8">
        <FailPanel
          track={finished.reveal}
          pool={finished.failStat?.pool ?? 16428}
          missPct={finished.failStat?.missPct ?? 38}
        />
        {claim ? <ClaimName onDone={() => setClaim(false)} /> : null}
      </div>
    );
  }

  return (
    <MarqueeFrame>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <p className="mono text-[11px] tracking-[0.18em] text-gold">{eyebrow}</p>
          <span className="horn-pill">हॉर्न ओके प्लीज</span>
        </div>
        <h1 className="devanagari text-center text-[52px] text-ink sm:text-[72px]">बीट पहचान</h1>
        <p className="display text-center text-xl text-gold sm:text-3xl">{headline}</p>
        <NightBus />
        <p className="display text-center text-xs text-mute">ALL NIGHT · NO LYRICS · START 0:00</p>

        <BeatPlayer
          key={track.id}
          trackId={track.id}
          audioSeed={track.audioSeed}
          waveform={track.waveformData}
          unlocked={unlock}
        />

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void lock();
          }}
        >
          <SearchField
            kind="song"
            label="GAANA"
            value={song}
            selectedId={songId}
            onChange={(t, id, meta) => {
              setSong(t);
              setSongId(id);
              if (meta?.artistName && !artist.trim()) setArtist(meta.artistName);
            }}
          />
          <SearchField
            kind="artist"
            label="ARTIST"
            value={artist}
            selectedId={artistId}
            onChange={(t, id) => {
              setArtist(t);
              setArtistId(id?.startsWith("live-") ? undefined : id);
            }}
          />

          {feedback ? (
            <p className="text-sm" role="status">
              {feedback}
            </p>
          ) : null}
          {err ? (
            <div className="space-y-2">
              <p className="text-sm text-err">{err}</p>
              <button type="button" className="text-xs tracking-widest" onClick={() => void lock()}>
                TRY AGAIN
              </button>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={busy}
              className="h-12 w-full bg-acid text-[13px] tracking-[0.18em] text-bg disabled:opacity-50"
            >
              LOCK KAR
            </button>
            {allowExtend && nextReveal(unlock) ? (
              <button
                type="button"
                onClick={more}
                className="h-11 w-full border border-gold/40 text-[12px] tracking-[0.16em] text-gold"
              >
                THODA AUR SUN
              </button>
            ) : null}
          </div>
        </form>

        <div className="keys flex flex-wrap items-center justify-center gap-2 text-[11px] text-mute">
          <kbd>SPACE</kbd> PLAY
          <kbd>G</kbd> GUESS
          <kbd>↑↓</kbd> SEARCH
        </div>
        <div className="flex items-center justify-between">
          <AttemptPips max={maxAttempts} used={attemptsUsed} />
          <p className="mono text-[11px] text-mute">{attemptsLeft} left</p>
        </div>
      </div>
    </MarqueeFrame>
  );
}
