"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { SearchHit } from "@/lib/types";

export function EditorialSearch({
  label,
  placeholder,
  cursor,
  value,
  onChange,
  onPick,
  kind,
}: {
  label: string;
  placeholder: string;
  cursor: string;
  value: string;
  onChange: (v: string) => void;
  onPick: (hit: SearchHit) => void;
  kind: "tracks" | "artists";
}) {
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState(false);
  const [loading, setLoading] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    const q = value.trim();
    if (q.length < 1 || picked) {
      setHits([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?kind=${kind}&q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        const json = (await res.json()) as { hits: SearchHit[] };
        setHits(json.hits);
        setOpen(json.hits.length > 0);
        setActive(0);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 90);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value, kind, picked]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function pick(hit: SearchHit) {
    setPicked(true);
    onPick(hit);
    setOpen(false);
  }

  return (
    <div ref={box} className="relative">
      <label className="mono text-smoke" htmlFor={listId + "-input"}>
        {label}
        {loading ? <span> …</span> : null}
      </label>
      <input
        id={listId + "-input"}
        className="field"
        data-cursor={cursor}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="search"
        enterKeyHint="search"
        onChange={(e) => {
          setPicked(false);
          onChange(e.target.value);
        }}
        onFocus={() => hits.length && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && open && hits[active]) {
            e.preventDefault();
            pick(hits[active]);
            return;
          }
          if (!open || !hits.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(hits.length - 1, a + 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          }
          if (e.key === "Escape") setOpen(false);
        }}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        role="combobox"
      />
      {open && hits.length > 0 ? (
        <div className="hits" role="listbox" id={listId}>
          {hits.map((hit, i) => (
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
                <span className="t">{renderHighlight(hit.title, hit.highlight)}</span>
                <span className="s block">{hit.subtitle}</span>
                {hit.meta && hit.meta !== hit.subtitle ? (
                  <span className="s block opacity-70">{hit.meta}</span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      ) : value.trim().length > 0 && !picked && !loading ? (
        <p className="mono mt-2 text-smoke">Kuch nahi mila.</p>
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
