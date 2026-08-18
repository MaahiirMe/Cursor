"use client";

import { useEffect, useMemo, useState } from "react";

export function CorrectReveal({
  copy,
  title,
  artists,
  artworkUrl,
  points,
  celebrate,
  onDone,
}: {
  copy: string;
  title?: string;
  artists?: string[];
  artworkUrl?: string;
  points?: number;
  celebrate: boolean;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"slam" | "info">("slam");
  const bits = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: `${(i * 17) % 100}%`,
        delay: `${(i % 8) * 40}ms`,
        color: ["#F1ECE2", "#FF4A1C", "#11100E", "#E8FF47"][i % 4],
        text: ["?", "DHH", "+", ""][i % 4],
      })),
    [],
  );

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("info"), 120);
    const t2 = setTimeout(onDone, celebrate ? 2200 : 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone, celebrate]);

  return (
    <div className="slam" role="status">
      {celebrate && phase !== "slam" ? (
        <div className="confetti" aria-hidden>
          {bits.map((b) => (
            <i
              key={b.id}
              style={{
                left: b.left,
                color: b.color,
                animationDelay: b.delay,
                background: b.text ? "transparent" : b.color,
                width: b.text ? "auto" : 8,
                height: b.text ? "auto" : 18,
              }}
            >
              {b.text}
            </i>
          ))}
        </div>
      ) : null}
      <div className="text-center px-4">
        <h2>{copy}</h2>
        {phase !== "slam" && title ? (
          <div className="mt-8 flex flex-col items-center gap-4">
            {artworkUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artworkUrl}
                alt=""
                className="h-28 w-28 rounded-full object-cover md:h-36 md:w-36"
              />
            ) : (
              <div className="h-28 w-28 rounded-full bg-[#1a1916] md:h-36 md:w-36" />
            )}
            <div className="font-serif text-4xl tracking-tight md:text-6xl">{title}</div>
            <div className="text-sm tracking-[0.2em] text-smoke">
              {artists?.join(" × ")}
            </div>
            {typeof points === "number" ? (
              <div className="font-mono text-2xl text-orange">
                {points.toLocaleString("en-IN")} PTS
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
