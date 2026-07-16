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
  createdByName?:string | null;
  updatedByName?:string | null;
  pendingTasks?: Task[]
  totalPendingTasks?:number;
}

interface Task {
  id: string;
  title: string;
  dueDate: string; // ISO 8601 date string
}