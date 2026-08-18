"use client";

export function PlayControl({
  playing,
  seconds,
  onPlay,
  onPause,
  onReplay,
  onHover,
}: {
  playing: boolean;
  seconds: number;
  onPlay: () => void;
  onPause: () => void;
  onReplay: () => void;
  onHover: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-7 gap-y-2" onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}>
      <button
        type="button"
        className="play-control"
        data-playing={playing}
        data-cursor="SUN"
        onClick={onPlay}
        aria-label={`Play ${seconds} seconds from the beginning`}
      >
        <span className="orbit" aria-hidden />
        <span className="text-orange">▶</span> SUN.
        <span className="ml-2 font-mono text-[0.32em] tracking-[0.14em] text-smoke">
          · {seconds} SEC
        </span>
      </button>
      <button
        type="button"
        className="font-mono text-sm tracking-[0.16em] disabled:opacity-30"
        disabled={!playing}
        onClick={onPause}
        aria-label="Pause"
      >
        ■ PAUSE
      </button>
      <button
        type="button"
        className="font-mono text-sm tracking-[0.16em]"
        onClick={onReplay}
        aria-label="Replay from the beginning"
      >
        ↺ REPLAY
      </button>
    </div>
  );
}
