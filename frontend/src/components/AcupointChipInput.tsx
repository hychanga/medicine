"use client";

import { useEffect, useRef, useState } from "react";
import { POINTS } from "@/lib/acupoints";
import s from "./AcupointChipInput.module.css";

const POINT_MAP = Object.fromEntries(POINTS.map((p) => [p.id, p]));

interface Props {
  value: string[];
  onChange: (points: string[]) => void;
}

export default function AcupointChipInput({ value, onChange }: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [errText, setErrText] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const term = input.trim().toLowerCase();

  const suggestions = term.length === 0
    ? []
    : POINTS.filter((p) => {
        if (value.includes(p.id)) return false;
        return (
          p.id.toLowerCase().includes(term) ||
          p.name.includes(term) ||
          p.py.toLowerCase().includes(term)
        );
      })
      // prioritise: exact id > name starts with > any contains
      .sort((a, b) => {
        const aExact = a.id.toLowerCase() === term ? 0 : a.name === term ? 1 : 2;
        const bExact = b.id.toLowerCase() === term ? 0 : b.name === term ? 1 : 2;
        return aExact - bExact;
      })
      .slice(0, 8);

  useEffect(() => setActiveIdx(0), [term]);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function add(pointId: string) {
    if (!value.includes(pointId)) onChange([...value, pointId]);
    setInput("");
    setErrText("");
    setOpen(false);
    // keep focus so user can keep typing
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function remove(pointId: string) {
    onChange(value.filter((id) => id !== pointId));
  }

  function commit() {
    const raw = input.trim();
    if (!raw) return;
    // Exact ID match (case-insensitive)
    const byId = POINTS.find((p) => p.id.toLowerCase() === raw.toLowerCase());
    if (byId) { add(byId.id); return; }
    // Exact name match
    const byName = POINTS.find((p) => p.name === raw);
    if (byName) { add(byName.id); return; }
    // Use top suggestion
    if (suggestions.length > 0) { add(suggestions[activeIdx]?.id ?? suggestions[0].id); return; }
    // Invalid
    setErrText(`「${raw}」不是有效穴位，請從建議清單中選擇`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
      setOpen(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && suggestions[activeIdx]) {
        add(suggestions[activeIdx].id);
      } else {
        commit();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setInput("");
      setErrText("");
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      remove(value[value.length - 1]);
    }
  }

  return (
    <div ref={wrapRef} className={s.wrap}>
      <div
        className={s.field}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((id) => {
          const p = POINT_MAP[id];
          const invalid = !p;
          return (
            <span key={id} className={`${s.chip} ${invalid ? s.chipInvalid : ""}`}>
              {p ? (
                <>
                  <span className={s.chipName}>{p.name}</span>
                  <span className={s.chipId}>{id}</span>
                </>
              ) : (
                <span className={s.chipId}>{id}</span>
              )}
              <button
                type="button"
                className={s.chipRemove}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => remove(id)}
                aria-label={`移除 ${id}`}
              >
                ×
              </button>
            </span>
          );
        })}
        <input
          ref={inputRef}
          className={s.input}
          value={input}
          placeholder={value.length ? "" : "輸入穴名或代號，如：合谷 或 LI4"}
          onChange={(e) => {
            setInput(e.target.value);
            setErrText("");
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => { if (term) setOpen(true); }}
        />
      </div>

      {errText && <p className={s.errHint}>{errText}</p>}

      {open && suggestions.length > 0 && (
        <ul className={s.dropdown} role="listbox">
          {suggestions.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === activeIdx}>
              <button
                type="button"
                className={`${s.option} ${i === activeIdx ? s.optionActive : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(p.id)}
                onMouseEnter={() => setActiveIdx(i)}
              >
                <span className={s.optionName}>{p.name}</span>
                <span className={s.optionId}>{p.id}</span>
                <span className={s.optionMeridian}>{p.meridian}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
