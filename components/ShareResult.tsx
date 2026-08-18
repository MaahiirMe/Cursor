"use client";

import { useState } from "react";
import type { SessionPublic } from "@/lib/types";

export function ShareResult({ session }: { session: SessionPublic }) {
  const [status, setStatus] = useState("");

  async function share() {
    const res = await fetch("/api/share");
    const json = (await res.json()) as { text: string };
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#11100E";
    ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = "#F1ECE2";
    ctx.font = "italic 180px serif";
    ctx.fillText("DHHUH?", 48, 280);
    ctx.fillStyle = "#FF4A1C";
    ctx.font = "italic 180px serif";
    ctx.fillText("?", 820, 280);
    ctx.fillStyle = "#AAA49A";
    ctx.font = "28px monospace";
    ctx.fillText(
      session.mode === "daily"
        ? `DAILY #${String(session.number).padStart(3, "0")}`
        : `#${String(session.number).padStart(4, "0")}`,
      56,
      360,
    );
    session.rounds.forEach((r, i) => {
      ctx.fillStyle = r.outcome === "correct" ? "#FF4A1C" : "#AAA49A";
      ctx.beginPath();
      ctx.arc(120, 520 + i * 90, 18, 0, Math.PI * 2);
      if (r.outcome === "correct") ctx.fill();
      else ctx.stroke();
      ctx.fillStyle = "#F1ECE2";
      ctx.font = "32px monospace";
      ctx.fillText(String(i + 1).padStart(2, "0"), 160, 530 + i * 90);
    });
    ctx.font = "italic 220px serif";
    ctx.fillStyle = "#F1ECE2";
    ctx.fillText(`${session.stats?.solved ?? 0}/5`, 56, 1200);
    ctx.font = "40px monospace";
    ctx.fillText(`${session.totalScore.toLocaleString("en-IN")} PTS`, 56, 1320);
    ctx.fillStyle = "#FF4A1C";
    ctx.font = "28px sans-serif";
    ctx.fillText("SUNKE BATA.", 56, 1780);
    ctx.fillStyle = "#AAA49A";
    ctx.font = "22px monospace";
    ctx.fillText("dhhuh.play", 56, 1840);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (navigator.share && blob) {
      const file = new File([blob], "dhhuh.png", { type: "image/png" });
      try {
        await navigator.share({ text: json.text, files: [file] });
        return;
      } catch {
        /* fall through */
      }
    }
    await navigator.clipboard.writeText(json.text);
    setStatus("COPIED.");
  }

  return (
    <button type="button" className="lock" onClick={share}>
      {status || "SHARE"}
    </button>
  );
}
