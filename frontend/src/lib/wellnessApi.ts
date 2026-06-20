// Client for the 養生 resources API (proxied through the BFF at /api/wellness).

export interface WellnessResource {
  id: number;
  title: string;
  summary: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  category: string | null;
  source: string | null;
  tags: string | null; // comma-separated
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WellnessInput {
  title: string;
  summary?: string | null;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  category?: string | null;
  source?: string | null;
  tags?: string | null;
}

// Suggested 養生 categories — a consistent taxonomy makes future data easier to
// browse/search. The form still allows a custom value (datalist), so this list
// can grow over time.
export const WELLNESS_CATEGORIES = [
  "食療藥膳",
  "經絡穴位",
  "四季養生",
  "體質調理",
  "臟腑保健",
  "情志養生",
  "運動導引",
  "起居作息",
  "常見病症",
] as const;

const BASE = "/api/wellness";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function listWellness(query?: string): Promise<WellnessResource[]> {
  const url = query ? `${BASE}?q=${encodeURIComponent(query)}` : BASE;
  return handle<WellnessResource[]>(await fetch(url, { cache: "no-store" }));
}

export async function createWellness(
  input: WellnessInput
): Promise<WellnessResource> {
  return handle<WellnessResource>(
    await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
}

export async function updateWellness(
  id: number,
  input: WellnessInput
): Promise<WellnessResource> {
  return handle<WellnessResource>(
    await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
}

export async function deleteWellness(id: number): Promise<void> {
  return handle<void>(await fetch(`${BASE}/${id}`, { method: "DELETE" }));
}

export async function retagWellness(id: number): Promise<WellnessResource> {
  return handle<WellnessResource>(
    await fetch(`${BASE}/${id}/retag`, { method: "POST" })
  );
}

/** Upload a PDF straight to GCS via a backend-minted signed URL; returns the
 *  public URL to store as pdfUrl. */
export async function uploadPdf(file: File): Promise<string> {
  const contentType = file.type || "application/pdf";
  const { uploadUrl, publicUrl } = await handle<{
    uploadUrl: string;
    publicUrl: string;
  }>(
    await fetch(`${BASE}/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType }),
    })
  );
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!put.ok) throw new Error(`上傳失敗 (${put.status})`);
  return publicUrl;
}

/** Best-effort YouTube embed URL from a watch/share/embed link. */
export function youtubeEmbed(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export function splitTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
