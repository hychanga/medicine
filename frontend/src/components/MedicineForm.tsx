"use client";

import { useState } from "react";
import type { Medicine, MedicineInput } from "@/lib/types";

interface Props {
  initial?: Medicine | null;
  onSubmit: (input: MedicineInput) => Promise<void>;
  onCancel: () => void;
}

export default function MedicineForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [dosage, setDosage] = useState(initial?.dosage ?? "");
  const [quantity, setQuantity] = useState(initial?.quantity ?? 0);
  const [manufacturer, setManufacturer] = useState(initial?.manufacturer ?? "");
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        dosage: dosage.trim() || null,
        quantity: Number(quantity) || 0,
        manufacturer: manufacturer.trim() || null,
        expiryDate: expiryDate || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const field =
    "w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500";
  const label = "block text-sm font-medium mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={label}>Name *</label>
        <input
          className={field}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Paracetamol"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Dosage</label>
          <input
            className={field}
            value={dosage ?? ""}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="e.g. 500mg"
          />
        </div>
        <div>
          <label className={label}>Quantity *</label>
          <input
            type="number"
            min={0}
            className={field}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div>
        <label className={label}>Manufacturer</label>
        <input
          className={field}
          value={manufacturer ?? ""}
          onChange={(e) => setManufacturer(e.target.value)}
          placeholder="e.g. Acme Pharma"
        />
      </div>

      <div>
        <label className={label}>Expiry date</label>
        <input
          type="date"
          className={field}
          value={expiryDate ?? ""}
          onChange={(e) => setExpiryDate(e.target.value)}
        />
      </div>

      <div>
        <label className={label}>Description</label>
        <textarea
          className={`${field} min-h-20`}
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notes about this medicine"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm font-medium border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Saving…" : initial ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
