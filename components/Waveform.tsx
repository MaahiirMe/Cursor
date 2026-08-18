"use client";

export function Waveform({
  state,
  unlockedRatio,
}: {
  state: "idle" | "hover" | "play";
  unlockedRatio: number;
}) {
  const bars = 64;
  const unlocked = Math.max(4, Math.round(bars * unlockedRatio));
  return (
    <div className="wave" data-state={state} aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <i
          key={i}
          data-locked={i >= unlocked}
          style={{
            height: `${8 + ((i * 17) % 28)}%`,
            animationDelay: `${(i % 9) * 40}ms`,
            ["--h" as string]: `${1.6 + ((i * 13) % 18) / 10}`,
          }}
        />
      ))}
    </div>
  );
}
