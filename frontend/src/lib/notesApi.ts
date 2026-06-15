// Personal acupoint notes — persisted in the backend (TiDB), proxied via /api.

export async function getNote(pointId: string): Promise<string> {
  try {
    const res = await fetch(`/api/notes/${encodeURIComponent(pointId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return "";
    const body = await res.json();
    return body?.content ?? "";
  } catch {
    return "";
  }
}

export async function saveNote(pointId: string, content: string): Promise<void> {
  const res = await fetch(`/api/notes/${encodeURIComponent(pointId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("save failed");
}
