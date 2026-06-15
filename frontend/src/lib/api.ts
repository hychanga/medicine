import type { Medicine, MedicineInput } from "./types";

// Same-origin: requests to /api/* are proxied to the backend by next.config rewrites.
const BASE = "/api/medicines";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function listMedicines(query?: string): Promise<Medicine[]> {
  const url = query ? `${BASE}?q=${encodeURIComponent(query)}` : BASE;
  return handle<Medicine[]>(await fetch(url, { cache: "no-store" }));
}

export async function createMedicine(input: MedicineInput): Promise<Medicine> {
  return handle<Medicine>(
    await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
}

export async function updateMedicine(
  id: number,
  input: MedicineInput
): Promise<Medicine> {
  return handle<Medicine>(
    await fetch(`${BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
}

export async function deleteMedicine(id: number): Promise<void> {
  return handle<void>(await fetch(`${BASE}/${id}`, { method: "DELETE" }));
}
