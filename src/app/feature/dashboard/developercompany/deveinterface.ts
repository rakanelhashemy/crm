export interface developerinterface {
  id: string;
  name: string;
  contactPhone?: string;
  contactEmail?: string;
  totalProperties: number;
  createdAt: string;
  updatedAt: string | null;
  createdByName: string;
  updatedByName: string | null;
}