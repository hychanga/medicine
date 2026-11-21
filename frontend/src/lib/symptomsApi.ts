export interface Formula {
  name: string;
  pattern: string;
  composition: string;
  usage: string;
  notes: string;
}

/** "web" = 網路整理；"scan" = 看診方劑掃描。 */
export type SymptomSourceType = "web" | "scan";

export interface SymptomGroupDto {
  id: number;
  name: string;
  category: string;
  description: string;
  formulas: Formula[];
  points: string[];
  sourceUrl?: string;
  sortOrder?: number;
  sourceType?: SymptomSourceType;
  visitDate?: string;
  clinic?: string;
  ocrText?: string;
  /** 掃描圖片的公開 GCS 網址 */
  imageUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SymptomGroupInput {
  name: string;
  category: string;
  description: string;
  formulas: Formula[];
  points: string[];
  sourceUrl?: string;
  sortOrder?: number;
  sourceType?: SymptomSourceType;
  visitDate?: string;
  clinic?: string;
  ocrText?: string;
  imageUrls?: string[];
}

export interface ScanParseResult {
  ocrText: string;
  imageUrls: string[];
  /** 自動整理的草稿；沒辨識到文字時為 null。找不到方劑時 draftError 會說明。 */
  draft: (Partial<SymptomGroupInput> & { visitDate?: string; clinic?: string }) | null;
  draftError?: string;
  /** 圖片存到 GCS 失敗時的訊息（辨識結果仍可用） */
  uploadError?: string;
}

/** 一次最多上傳的張數；Vercel 函式請求上限約 4.5 MB，所以先在瀏覽器縮圖。 */
export const MAX_SCAN_FILES = 4;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_SIDE = 2000;

/** 把照片縮到長邊 2000px 的 JPEG，降低上傳量與 Vision 費用，也順便轉正 EXIF 方向。 */
export async function shrinkImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`無法讀取「${file.name}」，請改用 JPG 或 PNG（iPhone 的 HEIC 請先轉檔）`);
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("瀏覽器不支援圖片處理");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("圖片轉檔失敗");
  return blob;
}

/** 上傳掃描圖片：後端用 Google Cloud Vision 辨識文字，再以規則整理成草稿。 */
export async function parseScan(files: File[]): Promise<ScanParseResult> {
  if (files.length === 0) throw new Error("請先選擇圖片");
  if (files.length > MAX_SCAN_FILES) throw new Error(`一次最多 ${MAX_SCAN_FILES} 張圖片`);
  const form = new FormData();
  let total = 0;
  for (const f of files) {
    const blob = await shrinkImage(f);
    total += blob.size;
    form.append("files", blob, f.name.replace(/\.[^.]+$/, "") + ".jpg");
  }
  if (total > MAX_UPLOAD_BYTES) {
    throw new Error("圖片總量太大，請減少張數後再試");
  }
  const res = await fetch("/api/symptoms/parse-scan", { method: "POST", body: form });
  if (!res.ok) throw new Error(await errorMessage(res));
  const data = await res.json();
  const d = data.draft;
  return {
    ocrText: data.ocrText ?? "",
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
    draftError: data.draftError ?? undefined,
    uploadError: data.uploadError ?? undefined,
    draft: d
      ? {
          name: d.name ?? "",
          category: d.category ?? "",
          description: d.description ?? "",
          formulas: Array.isArray(d.formulas) ? d.formulas : [],
          points: Array.isArray(d.points) ? d.points : [],
          visitDate: typeof d.visitDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.visitDate) ? d.visitDate : "",
          clinic: d.clinic ?? "",
        }
      : null,
  };
}

export async function listSymptoms(): Promise<SymptomGroupDto[]> {
  const res = await fetch("/api/symptoms", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load symptoms");
  return res.json();
}

export async function createSymptom(input: SymptomGroupInput): Promise<SymptomGroupDto> {
  const res = await fetch("/api/symptoms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toRequest(input)),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json();
}

export async function updateSymptom(id: number, input: SymptomGroupInput): Promise<SymptomGroupDto> {
  const res = await fetch(`/api/symptoms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toRequest(input)),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json();
}

export async function deleteSymptom(id: number): Promise<void> {
  const res = await fetch(`/api/symptoms/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await errorMessage(res));
}

export async function parseSymptomUrl(url: string): Promise<Partial<SymptomGroupInput>> {
  const res = await fetch("/api/symptoms/parse-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  const data = await res.json();
  return {
    name: data.name ?? "",
    category: data.category ?? "",
    description: data.description ?? "",
    formulas: Array.isArray(data.formulas) ? data.formulas : [],
    points: Array.isArray(data.points) ? data.points : [],
  };
}

function toRequest(input: SymptomGroupInput) {
  return {
    name: input.name,
    category: input.category,
    description: input.description,
    formulas: JSON.stringify(input.formulas),
    points: JSON.stringify(input.points),
    sourceUrl: input.sourceUrl,
    sortOrder: input.sortOrder,
    sourceType: input.sourceType,
    visitDate: input.visitDate,
    clinic: input.clinic,
    ocrText: input.ocrText,
    imageUrls: input.imageUrls,
  };
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j.message ?? j.error ?? `Error ${res.status}`;
  } catch {
    return `Error ${res.status}`;
  }
}
