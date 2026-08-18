"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COPY } from "@/lib/copy";
import { REVEAL_LADDER } from "@/lib/scoring";
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

export function GameSession({ mode }: { mode: GameMode }) {
  const [session, setSession] = useState<SessionPublic | null>(null);
  const [booting, setBooting] = useState(true);
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
  const [reveal, setReveal] = useState<{ copy: string; title?: string; artists?: string[] } | null>(null);
  const [name, setName] = useState("MC NAYA");
  const tick = useRef<number | null>(null);

  const start = useCallback(async () => {
    const res = await fetch("/api/game/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    const json = (await res.json()) as SessionPublic;
    setSession(json);
    resetGuess();
    setPlaying(false);
    setElapsed(0);
    setBooting(false);
  }, [mode]);

  useEffect(() => {
    start();
    const seen = sessionStorage.getItem("dhhuh-seen");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduce) {
      setIntro(false);
    } else {
      sessionStorage.setItem("dhhuh-seen", "1");
      const t = setTimeout(() => setIntro(false), 1100);
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

  function resetGuess() {
    setTrackQ("");
    setArtistQ("");
    setTrackId(null);
    setArtistId(null);
    setSkipAsk(false);
    setFlash(null);
  }

  async function lock() {
    if (!trackId || !artistId) return;
    const res = await fetch("/api/game/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId, artistId }),
    });
    const json = (await res.json()) as { session: SessionPublic; copy: string; verdict: string };
    setPlaying(false);
    setSession(json.session);
    if (json.verdict === "FULL_CORRECT") {
      const r = json.session.rounds[json.session.currentIndex];
      setReveal({ copy: json.copy, title: r.title, artists: r.artistNames });
    } else {
      setFlash(json.copy);
      if (json.session.rounds[json.session.currentIndex]?.outcome !== "pending") {
        setReveal({
          copy: json.copy,
          title: json.session.rounds[json.session.currentIndex].title,
          artists: json.session.rounds[json.session.currentIndex].artistNames,
        });
      }
    }
  }

  async function goNext() {
    setReveal(null);
    const res = await fetch("/api/game/next", { method: "POST" });
    const json = (await res.json()) as { session: SessionPublic };
    setSession(json.session);
    resetGuess();
    setElapsed(0);
    setPlaying(false);
  }

  async function more(seconds: number) {
    const res = await fetch("/api/game/more", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seconds }),
    });
    const json = (await res.json()) as { session: SessionPublic };
    setSession(json.session);
    setPlaying(false);
    setElapsed(0);
  }

  async function doSkip() {
    const res = await fetch("/api/game/skip", { method: "POST" });
    const json = (await res.json()) as { session: SessionPublic; copy: string };
    setSession(json.session);
    setReveal({
      copy: json.copy,
      title: json.session.rounds[json.session.currentIndex].title,
      artists: json.session.rounds[json.session.currentIndex].artistNames,
    });
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
        <div className="mt-4 flex items-end justify-between">
          <p className="mono text-smoke">TRACK {String(session.currentIndex + 1).padStart(2, "0")} / 05</p>
          <SessionProgress current={session.currentIndex} outcomes={progressOutcomes} />
          <p className="mono hidden text-smoke md:block">05 TRACKS</p>
        </div>

        <h1 className="hero-word mt-2 md:-mt-2">
          DHHUH<span className="q">?</span>
        </h1>
        <p className="tagline -mt-1 text-center md:-mt-3">{COPY.tagline}</p>

        <div className="mt-8 grid grid-cols-12 items-center gap-y-6">
          <div className="col-span-12 md:col-span-3">
            <PlayControl
              playing={playing}
              onToggle={() => {
                setElapsed(0);
                setPlaying((p) => !p);
              }}
              onHover={setHoverPlay}
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <div className="mb-2 flex justify-between font-mono text-[0.65rem] text-smoke">
              <span>{clock}</span>
              <span>{endClock}</span>
            </div>
            <Waveform state={waveState} unlockedRatio={unlocked} />
          </div>
          <p className="col-span-12 max-w-[16rem] justify-self-end text-right text-[0.72rem] leading-relaxed text-smoke md:col-span-3">
            {COPY.tip}
          </p>
        </div>

        <form
          className="mt-10 grid grid-cols-12 items-end gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            lock();
          }}
        >
          <div className="col-span-12 md:col-span-4">
            <EditorialSearch
              label="SONG KA NAAM"
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
              label="ARTIST / RAPPER"
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
            <button className="lock" type="submit" disabled={!trackId || !artistId} data-cursor="LOCK">
              {COPY.submit} →
            </button>
            <AttemptIndicator used={round.attemptsUsed} />
            <div>
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
        </form>

        {flash ? (
          <p className="mt-4 font-serif text-3xl" role="status">
            {flash}
          </p>
        ) : null}

        <div className="mt-10">
          <p className="mono text-smoke">{COPY.more}</p>
          <div className="mt-3 flex flex-wrap gap-6">
            {(mode === "hard" ? [1, ...REVEAL_LADDER.slice(0, 4)] : REVEAL_LADDER).map((sec) => {
              const popular = sec === 11;
              const unlockedSec = round.revealSeconds >= sec;
              return (
                <button
                  key={sec}
                  type="button"
                  className="relative font-mono text-sm tracking-[0.18em] disabled:opacity-40"
                  style={{ color: unlockedSec ? "#FF4A1C" : "#F1ECE2" }}
                  disabled={unlockedSec}
                  onClick={() => more(sec)}
                >
                  {String(sec).padStart(2, "0")} SEC
                  {popular ? (
                    <span className="absolute -top-4 left-0 bg-butter px-1 font-mono text-[0.55rem] text-ink">
                      POPULAR
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[0.7rem] text-smoke">{COPY.moreNote}</p>
        </div>

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
