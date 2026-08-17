"use client";

import { useEffect, useId, useRef, useState } from "react";
import { api } from "@/lib/guest-client";

type Item = { id: string; title?: string; name?: string; primaryArtistName?: string };

type Props = {
  kind: "song" | "artist";
  label: string;
  value: string;
  selectedId?: string;
  onChange: (text: string, id?: string) => void;
};

export function SearchField({ kind, label, value, selectedId, onChange }: Props) {
  const boxId = useId();
  const listId = `${boxId}-list`;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number>(0);

  useEffect(() => {
    if (!value.trim()) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      api<{ items: Item[] }>(`/api/search?type=${kind}&q=${encodeURIComponent(value)}`)
        .then((d) => {
          setItems(d.items);
          setOpen(true);
          setActive(0);
        })
        .catch(() => setItems([]));
    }, 80);
    return () => window.clearTimeout(timer.current);
  }, [value, kind]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (item: Item) => {
    onChange(item.title ?? item.name ?? "", item.id);
    setOpen(false);
  };

  const shown = value.trim() ? items : [];
  const labelOf = (item: Item) =>
    kind === "song" ? `${item.title} — ${item.primaryArtistName}` : (item.name ?? "");

  return (
    <div ref={wrapRef} className="relative">
      <label className="mono mb-1 block text-[10px] tracking-[0.2em] text-mute" htmlFor={boxId}>
        {label}
      </label>
      <input
        id={boxId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        placeholder={kind === "song" ? "Track name" : "Artist"}
        onChange={(e) => {
          onChange(e.target.value, undefined);
          setOpen(true);
        }}
        onFocus={() => shown.length && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(shown.length - 1, i + 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(0, i - 1));
          }
          if (e.key === "Enter" && open && shown[active]) {
            e.preventDefault();
            pick(shown[active]);
          }
        }}
        className="h-12 w-full border border-gold/30 bg-bg2 px-3 text-[16px] outline-none placeholder:text-mute/60 focus:border-acid"
      />
      {selectedId ? (
        <span className="mono absolute right-2 top-8 text-[9px] text-acid">LOCKED</span>
      ) : null}
      {open && shown.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto border border-ink/20 bg-bg2"
        >
          {shown.map((item, i) => (
            <li key={item.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={`flex w-full px-3 py-3 text-left text-sm ${i === active ? "bg-ink/8 text-ink" : "text-ink/80"}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(item)}
              >
                {labelOf(item)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
