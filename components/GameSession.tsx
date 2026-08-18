"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COPY } from "@/lib/copy";
import { LISTEN_PENALTY } from "@/lib/scoring";
import type { GameMode, SearchHit, SessionPublic } from "@/lib/types";
import { AudioExperience } from "./AudioExperience";
import { AudioStrip } from "./AudioStrip";
import { CorrectReveal } from "./CorrectReveal";
import { CustomCursor } from "./CustomCursor";
import { EditorialNav } from "./EditorialNav";
import { EditorialSearch } from "./EditorialSearch";
import { PlayControl } from "./PlayControl";
import { AttemptIndicator, SessionProgress } from "./Progress";
import { SessionResult } from "./SessionResult";
import { Waveform } from "./Waveform";

type RevealState = {
  copy: string;
  title?: string;
  artists?: string[];
  artworkUrl?: string;
  points?: number;
  celebrate: boolean;
};

export function GameSession({ mode }: { mode: GameMode }) {
  const [session, setSession] = useState<SessionPublic | null>(null);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [intro, setIntro] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [hoverPlay, setHoverPlay] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [trackQ, setTrackQ] = useState("");
  const [artistQ, setArtistQ] = useState("");
  const [trackId, setTrackId] = useState<string | null>(null);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [skipAsk, setSkipAsk] = useState(false);
  const [reveal, setReveal] = useState<RevealState | null>(null);
  const [name, setName] = useState("GUEST");
  const tick = useRef<number | null>(null);

  const start = useCallback(async () => {
    setError(null);
    setBooting(true);
    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) throw new Error("start failed");
      const json = (await res.json()) as SessionPublic;
      setSession(json);
      setTrackQ("");
      setArtistQ("");
      setTrackId(null);
      setArtistId(null);
      setSkipAsk(false);
      setFlash(null);
      setPlaying(false);
      setElapsed(0);
      setReveal(null);
    } catch {
      setError(COPY.error);
    } finally {
      setBooting(false);
    }
  }, [mode]);

  useEffect(() => {
    start();
    const seen = sessionStorage.getItem("dhhuh-seen");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce) setIntro(false);
    else {
      sessionStorage.setItem("dhhuh-seen", "1");
      const t = setTimeout(() => setIntro(false), 900);
      return () => clearTimeout(t);
    }
  }, [start]);

  useEffect(() => {
    const vv = window.visualViewport;
    const onResize = () => {
      if (!vv) return;
      document.body.classList.toggle("kb-open", window.innerHeight - vv.height > 120);
    };
    vv?.addEventListener("resize", onResize);
    return () => vv?.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p: { username?: string }) => {
        if (p.username) setName(p.username);
      })
      .catch(() => undefined);
  }, []);

  const round = session?.rounds[session.currentIndex];

  useEffect(() => {
    if (!playing || !round) return;
    const t0 = performance.now();
    const loop = (now: number) => {
      const e = Math.min(round.revealSeconds, (now - t0) / 1000);
      setElapsed(e);
      if (e < round.revealSeconds) tick.current = requestAnimationFrame(loop);
    };
    tick.current = requestAnimationFrame(loop);
    return () => {
      if (tick.current) cancelAnimationFrame(tick.current);
    };
  }, [playing, round]);

  async function lock() {
    if (!trackId || !artistId || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/game/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId, artistId }),
      });
      const json = (await res.json()) as {
        session?: SessionPublic;
        copy: string;
        verdict: string;
        error?: string;
      };
      if (!json.session) throw new Error(json.error);
      setPlaying(false);
      setSession(json.session);
      const r = json.session.rounds[json.session.currentIndex];
      if (json.verdict === "FULL_CORRECT") {
        setReveal({
          copy: json.copy,
          title: r.title,
          artists: r.artistNames,
          artworkUrl: r.artworkUrl,
          points: r.score,
          celebrate: true,
        });
      } else if (r.outcome !== "pending") {
        setReveal({
          copy: json.copy,
          title: r.title,
          artists: r.artistNames,
          artworkUrl: r.artworkUrl,
          points: 0,
          celebrate: false,
        });
      } else {
        setFlash(json.copy);
        setTrackId(null);
        setArtistId(null);
      }
    } catch {
      setFlash(COPY.error);
    } finally {
      setBusy(false);
    }
  }

  const goNext = useCallback(async () => {
    setReveal(null);
    try {
      const res = await fetch("/api/game/next", { method: "POST" });
      const json = (await res.json()) as { session: SessionPublic };
      setSession(json.session);
      setTrackQ("");
      setArtistQ("");
      setTrackId(null);
      setArtistId(null);
      setSkipAsk(false);
      setFlash(null);
      setElapsed(0);
      setPlaying(false);
    } catch {
      setError(COPY.error);
    }
  }, []);

  async function more() {
    if (!round?.canAddTime || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/game/more", { method: "POST" });
      const json = (await res.json()) as { session: SessionPublic };
      setSession(json.session);
      setElapsed(0);
      setPlaying(true);
    } catch {
      setFlash(COPY.error);
    } finally {
      setBusy(false);
    }
  }

  async function hint() {
    if (round?.nextHintCost == null || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/game/hint", { method: "POST" });
      const json = (await res.json()) as { session: SessionPublic };
      setSession(json.session);
    } catch {
      setFlash(COPY.error);
    } finally {
      setBusy(false);
    }
  }

  async function doSkip() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/game/skip", { method: "POST" });
      const json = (await res.json()) as { session: SessionPublic; copy: string };
      setPlaying(false);
      setSession(json.session);
      const r = json.session.rounds[json.session.currentIndex];
      setReveal({
        copy: json.copy,
        title: r.title,
        artists: r.artistNames,
        artworkUrl: r.artworkUrl,
        points: 0,
        celebrate: false,
      });
    } catch {
      setFlash(COPY.error);
    } finally {
      setBusy(false);
    }
  }

  const waveState = playing ? "play" : hoverPlay ? "hover" : "idle";
  const unlocked = (round?.revealSeconds ?? 2) / 16;
  const progressOutcomes = session?.rounds.map((r) => r.outcome) ?? [
    "pending",
    "pending",
    "pending",
    "pending",
    "pending",
  ];
  const clock = useMemo(() => format(elapsed), [elapsed]);
  const endClock = format(round?.revealSeconds ?? 2);

  if (error && !session) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="font-serif text-5xl">{COPY.error}</p>
          <button type="button" className="lock mt-8" onClick={start}>
            PHIR SE
          </button>
        </div>
      </main>
    );
  }

  if (booting || !session || !round) {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="mono text-smoke">INDIAN DESI HIP-HOP</p>
      </main>
    );
  }

  if (session.status === "complete" && !reveal) {
    return (
      <>
        <CustomCursor />
        <EditorialNav sessionLabel={`SESSION ${String(session.number).padStart(4, "0")}`} name={name} />
        <SessionResult
          session={session}
          onReplay={start}
          onName={async (n) => {
            await fetch("/api/profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: n }),
            });
            setName(n.toUpperCase());
          }}
        />
      </>
    );
  }

  return (
    <>
      <CustomCursor />
      <EditorialNav
        sessionLabel={`${mode === "daily" ? "DAILY" : "SESSION"} ${String(session.number).padStart(4, "0")}`}
        name={name}
      />
      {intro ? <Intro /> : null}

      <main className="relative px-4 pb-8 md:px-8">
        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="mono text-smoke">
            TRACK {String(session.currentIndex + 1).padStart(2, "0")} / 05
          </p>
          <SessionProgress current={session.currentIndex} outcomes={progressOutcomes} />
          <p className="mono text-orange">{round.possibleScore} PTS</p>
        </div>

        <h1 className="hero-word mt-2 md:-mt-2">
          DHHUH<span className="q">?</span>
        </h1>
        <p className="tagline -mt-1 text-center md:-mt-3">{COPY.tagline}</p>
        <p className="mt-3 text-center font-mono text-[0.65rem] tracking-[0.18em] text-smoke">
          {COPY.loop}
        </p>

        <div className="mt-8 grid grid-cols-12 items-center gap-y-6">
          <div className="col-span-12 md:col-span-4">
            <PlayControl
              playing={playing}
              seconds={round.revealSeconds}
              onToggle={() => {
                setElapsed(0);
                setPlaying((p) => !p);
              }}
              onHover={setHoverPlay}
            />
            <div className="mt-5 flex flex-wrap items-baseline gap-x-8 gap-y-3">
              <button
                type="button"
                className="text-left font-mono text-sm tracking-[0.12em] disabled:opacity-30"
                disabled={!round.canAddTime || busy}
                onClick={more}
              >
                {COPY.plus2}
                <span className="mt-1 block text-[0.65rem] text-smoke">−{LISTEN_PENALTY} PTS</span>
              </button>
              <button
                type="button"
                className="text-left font-mono text-sm tracking-[0.12em] disabled:opacity-30"
                disabled={round.nextHintCost == null || busy}
                onClick={hint}
              >
                {COPY.hint}
                {round.nextHintCost != null ? (
                  <span className="mt-1 block text-[0.65rem] text-smoke">
                    0{round.purchasedHints.length + 1} · −{round.nextHintCost} PTS
                  </span>
                ) : (
                  <span className="mt-1 block text-[0.65rem] text-smoke">DONE</span>
                )}
              </button>
              {skipAsk ? (
                <div className="mono">
                  {COPY.skipConfirm}{" "}
                  <button type="button" className="text-orange" onClick={doSkip}>
                    {COPY.skipYes}
                  </button>
                  <span className="text-smoke"> / </span>
                  <button type="button" onClick={() => setSkipAsk(false)}>
                    {COPY.skipNo}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="mono text-smoke"
                  data-cursor="PAKKA?"
                  onClick={() => setSkipAsk(true)}
                >
                  {COPY.skip}
                </button>
              )}
            </div>
          </div>
          <div className="col-span-12 md:col-span-8">
            <div className="mb-2 flex justify-between font-mono text-[0.65rem] text-smoke">
              <span>{clock}</span>
              <span>{endClock}</span>
            </div>
            <Waveform state={waveState} unlockedRatio={unlocked} />
          </div>
        </div>

        {round.purchasedHints.length > 0 ? (
          <ol className="mt-8 max-w-xl space-y-2">
            {round.purchasedHints.map((h) => (
              <li key={h.index} className="text-[0.95rem] leading-snug">
                <span className="mono text-smoke">HINT 0{h.index} · −{h.cost} PTS</span>
                <span className="ml-3">{h.text}</span>
              </li>
            ))}
          </ol>
        ) : null}

        <form
          className="mt-10 grid grid-cols-12 items-end gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            lock();
          }}
        >
          <div className="col-span-12 md:col-span-4">
            <EditorialSearch
              label="TRACK"
              placeholder={COPY.searchSong}
              cursor="TYPE"
              kind="tracks"
              value={trackQ}
              onChange={(v) => {
                setTrackQ(v);
                setTrackId(null);
              }}
              onPick={(hit: SearchHit) => {
                setTrackQ(hit.title);
                setTrackId(hit.id);
              }}
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <EditorialSearch
              label="ARTIST"
              placeholder={COPY.searchArtist}
              cursor="TYPE"
              kind="artists"
              value={artistQ}
              onChange={(v) => {
                setArtistQ(v);
                setArtistId(null);
              }}
              onPick={(hit: SearchHit) => {
                setArtistQ(hit.title);
                setArtistId(hit.id);
              }}
            />
          </div>
          <div className="col-span-12 flex flex-wrap items-center gap-6 md:col-span-4">
            <button
              className="lock"
              type="submit"
              disabled={!trackId || !artistId || busy}
              data-cursor="LOCK"
            >
              {COPY.submit} →
            </button>
            <AttemptIndicator used={round.attemptsUsed} />
          </div>
        </form>

        {flash ? (
          <p className="mt-5 font-serif text-3xl md:text-4xl" role="status">
            {flash}
          </p>
        ) : null}

        <AudioStrip rounds={session.rounds} current={session.currentIndex} />
      </main>

      {round.playback ? (
        <AudioExperience
          playback={round.playback}
          duration={round.revealSeconds}
          playing={playing}
          onStopped={() => setPlaying(false)}
        />
      ) : null}

      {reveal ? (
        <CorrectReveal
          copy={reveal.copy}
          title={reveal.title}
          artists={reveal.artists}
          artworkUrl={reveal.artworkUrl}
          points={reveal.points}
          celebrate={reveal.celebrate}
          onDone={goNext}
        />
      ) : null}
    </>
  );
}

function format(n: number) {
  const s = Math.floor(n);
  return `00:${String(s).padStart(2, "0")}`;
}

function Intro() {
  return (
    <div className="slam z-[60]">
      <div className="text-center">
        <p className="mono mb-6 text-smoke">INDIAN DESI HIP-HOP</p>
        <h2>
          DHHUH<span className="text-orange">?</span>
        </h2>
        <p className="tagline mt-4">{COPY.tagline}</p>
      </div>
    </div>
  );
}
