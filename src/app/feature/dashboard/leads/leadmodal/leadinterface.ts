export interface Leadd {
  id: string; 
  fullName: string | null;
  phone: string;
  status: number;
  statusLabel: string;
  source: number;
  notes: string | null;
  sourceLabel: string;
  propertyTypeId: string;
  propertyTypeName: string | null; 
  budget: number | null;
  ownerName: string | null;
  ownerId: number | null;
  isConverted: boolean;
  customerId: string | null;
  createdAt: string;
  updatedAt: string | null;
}