"use client";

export function AttemptIndicator({ used, max = 5 }: { used: number; max?: number }) {
  return (
    <div className="flex items-baseline gap-3" aria-label={`${max - used} attempts left`}>
      <span className="mono text-smoke">{max} attempts</span>
      <span className="tracking-[0.35em] text-[1.05rem]" aria-hidden>
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={i < used ? "text-orange" : "text-smoke/40"}>
            {i < used ? "●" : "○"}
          </span>
        ))}
      </span>
    </div>
  );
}

export function SessionProgress({
  current,
  outcomes,
}: {
  current: number;
  outcomes: Array<"pending" | "correct" | "failed" | "skipped">;
}) {
  return (
    <ol className="mono flex flex-wrap gap-3 text-smoke" aria-label="Session progress">
      {outcomes.map((o, i) => {
        const n = String(i + 1).padStart(2, "0");
        const currentish = i === current && o === "pending";
        let mark = n;
        if (o === "correct") mark = `${n} ●`;
        if (o === "failed" || o === "skipped") mark = `${n}̶`;
        return (
          <li
            key={i}
            className={currentish ? "text-paper" : o === "correct" ? "text-orange" : ""}
            style={currentish ? { fontSize: "0.9rem" } : undefined}
          >
            {i > 0 ? <span className="mr-3 text-smoke/50">—</span> : null}
            {o === "failed" || o === "skipped" ? <s>{n}</s> : mark.replace("̶", "")}
          </li>
        );
      })}
    </ol>
  );
}
