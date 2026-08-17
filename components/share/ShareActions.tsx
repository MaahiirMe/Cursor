"use client";

import { useRef, useState } from "react";
import { SITE } from "@/lib/config";

export function ShareActions({
  text,
  title,
  score,
  challenge,
}: {
  text: string;
  title: string;
  score: number;
  challenge: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const w = 1080;
    const h = 1920;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#0A0A0A";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#C8FF00";
    ctx.lineWidth = 6;
    ctx.strokeRect(48, 48, w - 96, h - 96);
    ctx.fillStyle = "#C8FF00";
    ctx.fillRect(120, 420, 840, 28);
    ctx.fillStyle = "#F3F0E8";
    ctx.font = "700 72px Impact, sans-serif";
    ctx.fillText("BEAT PEHCHAAN", 120, 280);
    ctx.font = "48px monospace";
    ctx.fillStyle = "#8D8D86";
    ctx.fillText(challenge, 120, 360);
    ctx.fillStyle = "#F3F0E8";
    ctx.font = "900 180px Impact, sans-serif";
    ctx.fillText(String(score), 120, 980);
    ctx.font = "40px monospace";
    ctx.fillStyle = "#C8FF00";
    ctx.fillText("PTS", 120, 1060);
    ctx.fillStyle = "#8D8D86";
    ctx.font = "32px sans-serif";
    ctx.fillText("PEHCHAAN BEAT SE.", 120, 1680);
    ctx.fillText(SITE.domain, 120, 1740);
    return canvas;
  };

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const share = async () => {
    const canvas = draw();
    let files: File[] = [];
    if (canvas) {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (blob) files = [new File([blob], "beat-pehchaan.png", { type: "image/png" })];
    }
    if (navigator.share) {
      try {
        await navigator.share({ title, text, files: files.length ? files : undefined });
        return;
      } catch {
        /* fall through */
      }
    }
    await copy();
  };

  return (
    <div className="flex flex-col gap-2">
      <canvas ref={canvasRef} className="hidden" aria-hidden />
      <button type="button" onClick={() => void share()} className="h-11 border border-ink/20 text-[12px] tracking-[0.14em]">
        SHARE CARD
      </button>
      <button type="button" onClick={() => void copy()} className="h-11 border border-ink/20 text-[12px] tracking-[0.14em]">
        {copied ? "COPIED" : "COPY RESULT"}
      </button>
    </div>
  );
}
