"use client";

import { useEffect, useRef, useState } from "react";

const FONTS = [
  { label: "預設字型", value: "" },
  { label: "楷體", value: "KaiTi, 楷體-GB2312, serif" },
  { label: "宋體", value: "SimSun, 宋體, 新細明體, serif" },
  { label: "黑體", value: "SimHei, 黑體, sans-serif" },
  { label: "仿宋", value: "FangSong, 仿宋-GB2312, serif" },
];

const SIZES = [
  { label: "字級", value: "" },
  { label: "小  12px", value: "12px" },
  { label: "標準 16px", value: "16px" },
  { label: "中  20px", value: "20px" },
  { label: "大  24px", value: "24px" },
  { label: "特大 32px", value: "32px" },
];

// ── Preset colour palettes ───────────────────────────────────────────────────

const FG_COLORS = [
  // Grayscale
  "#000000", "#374151", "#6b7280", "#9ca3af", "#d1d5db", "#ffffff",
  // Vivid
  "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0284c7", "#7c3aed",
  // Soft
  "#f87171", "#fb923c", "#facc15", "#4ade80", "#38bdf8", "#c084fc",
  // Deep / 中醫常用
  "#7f1d1d", "#78350f", "#713f12", "#14532d", "#0c4a6e", "#4c1d95",
];

// "transparent" means "remove background"
const BG_COLORS = [
  "transparent",
  "#fef9c3", "#dcfce7", "#dbeafe", "#fce7f3", "#f3e8ff",
  "#fde68a", "#bbf7d0", "#bfdbfe", "#f9a8d4", "#d8b4fe", "#fed7aa",
  "#fef08a", "#86efac", "#93c5fd", "#f472b6", "#a78bfa", "#fb923c",
  "#facc15", "#4ade80", "#60a5fa", "#e879f9", "#818cf8", "#f97316",
];

// ── ColorPicker sub-component ────────────────────────────────────────────────

interface CPProps {
  label: React.ReactNode;
  colors: string[];
  defaultCustom: string;
  onSelect: (color: string) => void;
  title?: string;
}

function ColorPicker({ label, colors, defaultCustom, onSelect, title }: CPProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        title={title}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className="flex select-none items-center gap-0.5 rounded px-1.5 py-0.5 text-xs hover:bg-black/10 dark:hover:bg-white/10"
      >
        {label}
        <span className="ml-0.5 text-gray-400">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border bg-white p-2 shadow-xl dark:border-gray-600 dark:bg-gray-800">
          <div className="grid grid-cols-6 gap-1">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                title={c === "transparent" ? "無底色" : c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onSelect(c); setOpen(false); }}
                className="h-5 w-5 rounded border border-gray-200 transition-transform hover:scale-125 hover:border-gray-400 dark:border-gray-600"
                style={
                  c === "transparent"
                    ? {
                        background:
                          "linear-gradient(135deg,#fff 40%,#f87171 40%,#f87171 60%,#fff 60%)",
                      }
                    : { background: c }
                }
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5 border-t pt-2 dark:border-gray-600">
            <span className="text-xs text-gray-500 dark:text-gray-400">自訂</span>
            <input
              ref={inputRef}
              type="color"
              defaultValue={defaultCustom}
              className="h-5 w-5 cursor-pointer rounded border border-gray-200 p-0 dark:border-gray-600"
              onChange={(e) => onSelect(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main RichTextEditor ──────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/**
 * Lightweight contentEditable rich-text editor. Supports bold/italic/underline,
 * font family, font size, text colour (24 presets + custom), background colour
 * (23 presets + custom), and clear-formatting. Uses document.execCommand (still
 * functional in all major browsers). Pass a new `key` when switching records so
 * the component remounts and loads the correct initial value.
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = "",
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const composing = useRef(false);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreAndFocus() {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  }

  function emit() {
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function exec(cmd: string, val?: string) {
    restoreAndFocus();
    document.execCommand(cmd, false, val);
    emit();
  }

  function applyFontSize(size: string) {
    if (!size || !editorRef.current) return;
    restoreAndFocus();
    document.execCommand("fontSize", false, "7");
    editorRef.current.querySelectorAll('font[size="7"]').forEach((el) => {
      const span = document.createElement("span");
      span.style.fontSize = size;
      span.innerHTML = el.innerHTML;
      el.parentNode?.replaceChild(span, el);
    });
    emit();
  }

  function applyFgColor(color: string) {
    restoreAndFocus();
    document.execCommand("foreColor", false, color);
    emit();
  }

  function applyBgColor(color: string) {
    restoreAndFocus();
    if (color === "transparent") {
      // Remove background by applying white then removeFormat is not enough;
      // use the "inherited" transparent value explicitly.
      if (!document.execCommand("hiliteColor", false, "rgba(0,0,0,0)")) {
        document.execCommand("backColor", false, "rgba(0,0,0,0)");
      }
    } else {
      if (!document.execCommand("hiliteColor", false, color)) {
        document.execCommand("backColor", false, color);
      }
    }
    emit();
  }

  const btn =
    "select-none rounded px-2 py-1 text-sm hover:bg-black/10 active:bg-black/20 dark:hover:bg-white/10 dark:active:bg-white/20";
  const sep = <span className="text-gray-300 dark:text-gray-600">│</span>;

  return (
    <div className="overflow-hidden rounded border border-gray-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-400 dark:border-gray-600">
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-gray-50 px-1.5 py-1 dark:border-gray-700 dark:bg-gray-800">
        <button
          type="button"
          title="粗體 (Ctrl+B)"
          className={`${btn} font-bold`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("bold")}
        >
          B
        </button>
        <button
          type="button"
          title="斜體 (Ctrl+I)"
          className={`${btn} italic`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("italic")}
        >
          I
        </button>
        <button
          type="button"
          title="底線 (Ctrl+U)"
          className={`${btn} underline`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("underline")}
        >
          U
        </button>

        {sep}

        <select
          title="字型"
          className="rounded border border-gray-200 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          defaultValue=""
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => {
            if (e.target.value) exec("fontName", e.target.value);
            e.target.value = "";
          }}
        >
          {FONTS.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <select
          title="字級"
          className="rounded border border-gray-200 px-1 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          defaultValue=""
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => {
            applyFontSize(e.target.value);
            e.target.value = "";
          }}
        >
          {SIZES.map((s) => (
            <option key={s.label} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        {sep}

        {/* Text colour with presets */}
        <ColorPicker
          title="文字顏色"
          label={
            <span
              className="text-sm font-bold"
              style={{ borderBottom: "3px solid #dc2626" }}
            >
              A
            </span>
          }
          colors={FG_COLORS}
          defaultCustom="#dc2626"
          onSelect={applyFgColor}
        />

        {/* Background colour with presets */}
        <ColorPicker
          title="底色"
          label={
            <span
              className="rounded px-0.5 text-xs"
              style={{ background: "#fef08a", color: "#374151" }}
            >
              底色
            </span>
          }
          colors={BG_COLORS}
          defaultCustom="#fef08a"
          onSelect={applyBgColor}
        />

        {sep}

        <button
          type="button"
          title="清除格式"
          className={`${btn} text-xs text-gray-500`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("removeFormat")}
        >
          清除格式
        </button>
      </div>

      {/* ── Editable area ────────────────────────────────────────────── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onBlur={saveSelection}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onInput={() => {
          if (!composing.current) emit();
        }}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
          emit();
        }}
        className="min-h-[130px] p-3 text-sm leading-relaxed outline-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] dark:bg-gray-900 dark:text-gray-100 dark:empty:before:text-gray-500"
      />
    </div>
  );
}
