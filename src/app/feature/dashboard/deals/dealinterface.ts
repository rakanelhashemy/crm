export interface PropertyDeal {
  id: string;
  propertyUnit: string;
  regionName: string;
  propertyTypeName: 'Residential' | string;
  developerCompany: string | null;
  customerName: string;
  stage: number;
  stageLabel: string;
  value: number;
  commissionPct: number;
  actualCommissionValue: number;
  isCommissionProjected: boolean;
  agentId: string;
  agentName: string;
  createdAt: string; // ISO Date string
}


export interface Dealll {
  id: string;
  propertyId: string;
  propertyUnit: string;
  regionName: string;
  addressName: string;
  propertyTypeName: string;
  developerCompany: string | null;
  expectedCommissionPct: number;
  customerId: string;
  customerName: string;
  agentId: string;
  agentName: string;
  stage: number;
  stageLabel: string;
  value: number;
  commissionPct: number;
  actualCommissionValue: number;
  isCommissionProjected: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdByName: string;
  updatedByName: string | null;
}