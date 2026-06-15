"use client";

import { useCallback, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import MedicineForm from "@/components/MedicineForm";
import {
  createMedicine,
  deleteMedicine,
  listMedicines,
  updateMedicine,
} from "@/lib/api";
import type { Medicine, MedicineInput } from "@/lib/types";

function expiryStatus(date: string | null): {
  label: string;
  className: string;
} | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(date);
  const days = Math.round((expiry.getTime() - today.getTime()) / 86_400_000);
  if (days < 0)
    return { label: "Expired", className: "bg-red-100 text-red-700" };
  if (days <= 90)
    return { label: "Expiring soon", className: "bg-amber-100 text-amber-700" };
  return { label: "Valid", className: "bg-green-100 text-green-700" };
}

export default function Home() {
  const { status: authStatus } = useSession();
  const authed = authStatus === "authenticated";
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      setMedicines(await listMedicines(query));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load medicines");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    const t = setTimeout(() => load(search.trim() || undefined), 300);
    return () => clearTimeout(t);
  }, [search, load, authed]);

  if (authStatus === "loading") {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <p className="text-sm text-black/60 dark:text-white/60">載入中…</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 sm:px-6 text-center">
        <h1 className="mb-3 text-2xl font-bold tracking-tight">💊 藥品庫存</h1>
        <p className="mb-6 text-sm text-black/60 dark:text-white/60">
          請先登入，藥品庫存為每位使用者各自儲存。
        </p>
        <button
          onClick={() => signIn("google")}
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          以 Google 登入
        </button>
      </main>
    );
  }

  async function handleSubmit(input: MedicineInput) {
    if (editing) {
      await updateMedicine(editing.id, input);
    } else {
      await createMedicine(input);
    }
    setShowForm(false);
    setEditing(null);
    await load(search.trim() || undefined);
  }

  async function handleDelete(m: Medicine) {
    if (!confirm(`Delete "${m.name}"?`)) return;
    try {
      await deleteMedicine(m.id);
      await load(search.trim() || undefined);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            💊 Medicine Inventory
          </h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {medicines.length} item{medicines.length === 1 ? "" : "s"} tracked
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add medicine
        </button>
      </header>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or manufacturer…"
        className="mb-6 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/20"
      />

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-black/60 dark:text-white/60">Loading…</p>
      ) : medicines.length === 0 ? (
        <p className="rounded-md border border-dashed border-black/15 px-4 py-12 text-center text-sm text-black/60 dark:border-white/20 dark:text-white/60">
          No medicines found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 dark:bg-white/10">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Dosage</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Manufacturer</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((m) => {
                const status = expiryStatus(m.expiryDate);
                return (
                  <tr
                    key={m.id}
                    className="border-t border-black/10 dark:border-white/10"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{m.name}</div>
                      {m.description && (
                        <div className="text-xs text-black/50 dark:text-white/50">
                          {m.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{m.dosage ?? "—"}</td>
                    <td className="px-4 py-3">{m.quantity}</td>
                    <td className="px-4 py-3">{m.manufacturer ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{m.expiryDate ?? "—"}</span>
                        {status && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditing(m);
                            setShowForm(true);
                          }}
                          className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowForm(false);
            setEditing(null);
          }}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-[var(--background)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold">
              {editing ? "Edit medicine" : "Add medicine"}
            </h2>
            <MedicineForm
              initial={editing}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
