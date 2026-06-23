"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={dark ? "切換亮色模式" : "切換暗色模式"}
      className="rounded px-2 py-1 text-base transition hover:bg-white/10"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
