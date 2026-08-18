"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchHit } from "@/lib/types";

export function EditorialSearch({
  label,
  cursor,
  value,
  onChange,
  onPick,
  kind,
}: {
  label: string;
  cursor: string;
  value: string;
  onChange: (v: string) => void;
  onPick: (hit: SearchHit) => void;
  kind: "tracks" | "artists";
}) {
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 1) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?kind=${kind}&q=${encodeURIComponent(q)}`, {
        signal: ctrl.signal,
      });
      const json = (await res.json()) as { hits: SearchHit[] };
      setHits(json.hits);
      setOpen(true);
      setActive(0);
    }, 40);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value, kind]);

  const marked = useMemo(() => hits, [hits]);

  function pick(hit: SearchHit) {
    onPick(hit);
    setOpen(false);
  }

  return (
    <div ref={box} className="relative">
      <div className="mono text-smoke">{label}</div>
      <input
        className="field"
        data-cursor={cursor}
        value={value}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => hits.length && setOpen(true)}
        onKeyDown={(e) => {
          if (!open || !hits.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(hits.length - 1, a + 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          }
          if (e.key === "Enter" && hits[active]) {
            e.preventDefault();
            pick(hits[active]);
          }
          if (e.key === "Escape") setOpen(false);
        }}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="dhhuh-hits"
        role="combobox"
      />
      {open && marked.length > 0 ? (
        <div className="hits" role="listbox" id="dhhuh-hits">
          {marked.map((hit, i) => (
            <button
              key={hit.id}
              type="button"
              role="option"
              aria-selected={i === active}
              data-active={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(hit)}
            >
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className="t">
                  {renderHighlight(hit.title, hit.highlight)}
                </span>
                <span className="s block">{hit.subtitle}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function renderHighlight(title: string, range: [number, number] | null) {
  if (!range) return title;
  const [a, b] = range;
  return (
    <>
      {title.slice(0, a)}
      <b>{title.slice(a, b)}</b>
      {title.slice(b)}
    </>
  );
}
