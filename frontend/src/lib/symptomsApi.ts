export interface Formula {
  name: string;
  pattern: string;
  composition: string;
  usage: string;
  notes: string;
}

export interface SymptomGroupDto {
  id: number;
  name: string;
  category: string;
  description: string;
  formulas: Formula[];
  points: string[];
  sourceUrl?: string;
  sortOrder?: number;
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
