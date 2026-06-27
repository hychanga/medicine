"use client";

import { useMemo } from "react";
import { useTheme } from "./ThemeProvider";
import { adjustHtmlColors } from "@/lib/htmlColors";

interface Props {
  html: string;
  className?: string;
}

/**
 * Renders stored rich-text HTML and automatically adjusts inline text colors
 * that would be unreadable in the current light/dark mode (e.g. black text
 * in dark mode, white text in light mode). Hue and saturation are preserved;
 * only the lightness is inverted when it falls outside a readable range.
 */
export default function SafeHtml({ html, className }: Props) {
  const { dark } = useTheme();
  const adjusted = useMemo(() => adjustHtmlColors(html, dark), [html, dark]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: adjusted }} />;
}
