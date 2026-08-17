"use client";

type Props = {
  data: number[];
  progress: number;
  unlocked: number;
  maxDuration: number;
  playing: boolean;
};

export function Waveform({ data, progress, unlocked, maxDuration, playing }: Props) {
  const unlockRatio = Math.min(1, unlocked / maxDuration);
  return (
    <div
      className={`flex h-28 w-full items-end gap-[2px] sm:h-36 ${playing ? "wave-play" : ""}`}
      role="img"
      aria-label={`Waveform, ${unlocked} seconds unlocked`}
    >
      {data.map((v, i) => {
        const pos = i / data.length;
        const known = pos <= unlockRatio;
        const active = pos <= progress;
        const h = 12 + v * 88;
        return (
          <span
            key={i}
            className="flex-1 origin-bottom"
            style={{
              height: `${h}%`,
                  background: !known
                    ? "rgba(246,239,227,0.08)"
                    : active
                      ? "#FF6A00"
                      : "rgba(245,197,24,0.55)",
              opacity: known ? 1 : 0.35,
              transform: playing && active ? `scaleY(${1 + (i % 3) * 0.04})` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
