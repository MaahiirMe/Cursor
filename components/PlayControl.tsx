"use client";

export function PlayControl({
  playing,
  onToggle,
  onHover,
}: {
  playing: boolean;
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
      aria-label={playing ? "Pause" : "Play from the beginning"}
    >
      <span className="orbit" aria-hidden />
      {playing ? "RUK." : "SUN."}
      <span className="ml-2 align-middle text-[0.45em] text-orange">{playing ? "■" : "▶"}</span>
    </button>
  );
}
