export interface Medicine {
  id: number;
  name: string;
  description: string | null;
  dosage: string | null;
  quantity: number;
  manufacturer: string | null;
  expiryDate: string | null; // ISO date (yyyy-MM-dd)
  createdAt: string;
  updatedAt: string;
}

export interface MedicineInput {
  name: string;
  description?: string | null;
  dosage?: string | null;
  quantity: number;
  manufacturer?: string | null;
  expiryDate?: string | null;
}
