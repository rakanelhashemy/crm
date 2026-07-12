 interface PropertyItemInterface {
  // IDs & Relations
  id: string;
  regionId: string;
  regionName: string;
  addressId: string;
  addressName: string;
  propertyTypeId: string;
  propertyTypeName: string;
  developerCompanyId: string | null;
  developerCompanyName: string | null;
  agentId: string;
  agentName: string;

  // Specifications & Details
  unit: string;
  beds: number;
  baths: number;
  area: number;
  officeNumbers: number;
  price: number;
  expectedCommissionPct: number;
  notes: string;

  // Status & Progress
  constructionStage: number;
  constructionStageLabel: string;
  status: number;
  statusLabel: string;
  totalDeals: number;


  createdAt: string; 
  updatedAt: string | null;
  createdByName: string;
  updatedByName: string | null;
}