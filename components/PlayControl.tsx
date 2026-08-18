"use client";

export function PlayControl({
  playing,
  seconds,
  onToggle,
  onHover,
}: {
  playing: boolean;
  seconds: number;
  onToggle: () => void;
  onHover: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="play-control"
      data-playing={playing}
      data-cursor="SUN"
      onClick={onToggle}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      aria-label={playing ? "Pause" : `Play ${seconds} seconds from the beginning`}
    >
      <span className="orbit" aria-hidden />
      <span className="text-orange">{playing ? "■" : "▶"}</span>{" "}
      {playing ? "PAUSE" : "PLAY"}
      <span className="ml-2 font-mono text-[0.32em] tracking-[0.14em] text-smoke">
        · {seconds} SEC
      </span>
    </button>
  );
}
