"use client";

import { useEffect, useRef } from "react";

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

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/**
 * Lightweight contentEditable rich-text editor. Supports bold/italic/underline,
 * font family, font size, text colour, and background colour. Uses
 * document.execCommand (still functional in all major browsers despite the
 * "deprecated" spec status). The key prop on the parent should change when
 * switching between edit targets so the component remounts and reads the new value.
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = "",
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const composing = useRef(false);

  // Set initial HTML on mount only — changing `value` from outside does not
  // reset cursor; use a new `key` prop to reinitialise for a different record.
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
    // Marker trick: execCommand tags selection with <font size="7">, then we
    // swap those elements for <span style="font-size: Xpx"> to get pixel values.
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
    // hiliteColor → Chrome; backColor → Firefox
    if (!document.execCommand("hiliteColor", false, color)) {
      document.execCommand("backColor", false, color);
    }
    emit();
  }

  const btn =
    "select-none rounded px-2 py-1 text-sm hover:bg-black/10 active:bg-black/20";
  const sep = <span className="text-gray-300">│</span>;

  return (
    <div className="overflow-hidden rounded border border-gray-300 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-400">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-gray-50 px-1.5 py-1">
        {/* Bold / Italic / Underline */}
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

        {/* Font family */}
        <select
          title="字型"
          className="rounded border border-gray-200 px-1 py-0.5 text-xs"
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

        {/* Font size */}
        <select
          title="字級"
          className="rounded border border-gray-200 px-1 py-0.5 text-xs"
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

        {/* Text colour */}
        <label
          title="文字顏色"
          className="flex cursor-pointer items-center gap-0.5 rounded px-1 py-0.5 hover:bg-black/10"
        >
          <span
            className="text-xs font-bold"
            style={{ borderBottom: "2px solid #e11d48" }}
          >
            A
          </span>
          <input
            type="color"
            defaultValue="#e11d48"
            className="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
            onChange={(e) => applyFgColor(e.target.value)}
          />
        </label>

        {/* Background colour */}
        <label
          title="底色"
          className="flex cursor-pointer items-center gap-0.5 rounded px-1 py-0.5 hover:bg-black/10"
        >
          <span
            className="rounded px-0.5 text-xs"
            style={{ background: "#fde68a" }}
          >
            底
          </span>
          <input
            type="color"
            defaultValue="#fde68a"
            className="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
            onChange={(e) => applyBgColor(e.target.value)}
          />
        </label>

        {sep}

        {/* Clear formatting */}
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

      {/* ── Editable area ───────────────────────────────────────────────── */}
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
        className="min-h-[130px] p-3 text-sm leading-relaxed outline-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
