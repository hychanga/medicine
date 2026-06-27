// Utilities for adapting inline HTML color styles between light and dark modes.
// Only foreground `color` is adjusted; background-color is left intentional.

function parseRgb(css: string): [number, number, number] | null {
  const m = css.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return [+m[1], +m[2], +m[3]];
  const h6 = css.match(/^#([0-9a-f]{6})$/i);
  if (h6) { const n = parseInt(h6[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  const h3 = css.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (h3) return [parseInt(h3[1] + h3[1], 16), parseInt(h3[2] + h3[2], 16), parseInt(h3[3] + h3[3], 16)];
  return null;
}

function linearize(v: number): number {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2 = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(hue2(h + 1 / 3) * 255), Math.round(hue2(h) * 255), Math.round(hue2(h - 1 / 3) * 255)];
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

// Returns an adjusted CSS color string, or null if no adjustment is needed.
function adaptColor(cssColor: string, isDark: boolean): string | null {
  const rgb = parseRgb(cssColor);
  if (!rgb) return null;
  const lum = relativeLuminance(...rgb);

  // Dark mode: colors with lum < 0.15 (near-black) become too hard to read on dark bg.
  // Light mode: colors with lum > 0.60 (near-white) become too hard to read on light bg.
  if (isDark ? lum >= 0.15 : lum <= 0.60) return null;

  // Invert the HSL lightness while preserving hue + saturation.
  const [h, s, l] = rgbToHsl(...rgb);
  const newL = isDark
    ? clamp(100 - l, 65, 92)  // dark → light  (e.g. black → near-white)
    : clamp(100 - l, 8, 35);  // light → dark  (e.g. white → near-black)
  const [r, g, b] = hslToRgb(h, s, newL);
  return `rgb(${r},${g},${b})`;
}

/**
 * Parse the stored HTML, find all inline `color` styles that would be
 * unreadable in the current mode, and return an adjusted HTML string.
 * No-ops on the server (document not available).
 */
export function adjustHtmlColors(html: string, isDark: boolean): string {
  if (typeof document === "undefined" || !html) return html;
  const div = document.createElement("div");
  div.innerHTML = html;

  div.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    const color = el.style.color;
    if (!color) return;
    const adjusted = adaptColor(color, isDark);
    if (adjusted) el.style.color = adjusted;
  });

  // Safety net for legacy <font color="..."> produced by some browsers.
  div.querySelectorAll<HTMLElement>("font[color]").forEach((el) => {
    const color = el.getAttribute("color");
    if (!color) return;
    const adjusted = adaptColor(color, isDark);
    if (adjusted) { el.style.color = adjusted; el.removeAttribute("color"); }
  });

  return div.innerHTML;
}
