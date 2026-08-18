"use client";

import { useEffect, useState } from "react";

export function CustomCursor() {
  const [pos, setPos] = useState({ x: -40, y: -40 });
  const [label, setLabel] = useState("");
  const [on, setOn] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    setOn(true);
    document.body.style.cursor = "none";
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      const el = (e.target as HTMLElement | null)?.closest("[data-cursor]");
      setLabel(el?.getAttribute("data-cursor") ?? "");
    };
    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mousemove", move);
      document.body.style.cursor = "";
    };
  }, []);

  if (!on) return null;
  return (
    <div
      className="cursor-dot"
      data-label={label}
      style={{ left: pos.x, top: pos.y }}
      aria-hidden
    >
      {label}
    </div>
  );
}
