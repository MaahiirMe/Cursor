"use client";

import { useEffect, useMemo, useState } from "react";

export function CorrectReveal({
  copy,
  title,
  artists,
  onDone,
}: {
  copy: string;
  title?: string;
  artists?: string[];
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"slam" | "info" | "done">("slam");
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
    const t1 = setTimeout(() => setPhase("info"), 150);
    const t2 = setTimeout(() => setPhase("done"), 1500);
    const t3 = setTimeout(onDone, 1700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div className="slam" role="status">
      <div className="confetti" aria-hidden>
        {phase !== "slam"
          ? bits.map((b) => (
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
            ))
          : null}
      </div>
      <div className="text-center">
        <h2>{copy}</h2>
        {phase !== "slam" && title ? (
          <div className="mt-6">
            <div className="font-serif text-4xl tracking-tight md:text-6xl">{title}</div>
            <div className="mt-2 text-sm tracking-[0.2em] text-smoke">
              {artists?.join(" × ")}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
