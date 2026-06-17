// Global calibrated acupoint coordinates, persisted in the backend (TiDB) and
// proxied via /api. Everyone reads them so the atlas shows calibrated positions;
// only an admin may write (enforced server-side in AcupointController).

export type XY = { x: number; y: number };

export async function getCoordOverrides(): Promise<Record<string, XY>> {
  try {
    const res = await fetch("/api/acupoints/coords", { cache: "no-store" });
    if (!res.ok) return {};
    const list: Array<{ pointId: string; x: number; y: number }> = await res.json();
    const map: Record<string, XY> = {};
    for (const c of list) map[c.pointId] = { x: c.x, y: c.y };
    return map;
  } catch {
    return {};
  }
}

export async function saveCoord(
  pointId: string,
  view: "front" | "back",
  x: number,
  y: number
): Promise<void> {
  const res = await fetch(`/api/acupoints/coords/${encodeURIComponent(pointId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ view, x, y }),
  });
  if (!res.ok) throw new Error("save failed");
}
