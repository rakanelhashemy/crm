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