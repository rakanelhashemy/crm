
export interface ApiResponse<T> {
  statusCode: number;
  meta: unknown | null;
  succeeded: boolean;
  message: string;
  errors: string[];
  data: T;
}

export interface PagedResult<T> {
  data: T[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface KpiData {
  totalRevenue: number;
  activeDeals: number;
  openLeads: number;
  winRatePct: number;
  convertedLeads: number;
  totalCustomers: number;
  availableProperties: number;
}

export interface RevenuePoint {
  month: string; // e.g. "Jul 2026"
  value: number;
}

export interface LabeledCount {
  label: string;
  count: number;
}

export interface DealStageCount {
  stage: string;
  count: number;
}

export interface PropertyStatusCount {
  status: string;
  count: number;
}

export interface PropertyTypeRevenue {
  propertyType: string;
  revenue: number;
}

export interface TopAgent {
  agentId: string;
  agentName: string;
  revenue: number;
  dealsWon: number;
  totalLeads: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalLeads: number;
  dealsWon: number;
  revenue: number;
  winRatePct: number;
  avgDealValue: number;
}

// Fixed stage/status ordering + colors used to render the donut & pipeline bars
// consistently regardless of what order the API returns them in.
export const LEAD_STAGE_ORDER = [
  'No Answer', 'Fresh', 'Interested', 'Not Interested',
  'Follow Up', 'Meeting', 'Negotiation', 'Done Deal', 'Lost'
] as const;

export const LEAD_STAGE_COLORS: Record<string, string> = {
  'No Answer': 'var(--text-tertiary)',
  'Fresh': 'var(--info-600)',
  'Interested': '#7A4FC4',
  'Not Interested': '#C8722E',
  'Follow Up': 'var(--warn-600)',
  'Meeting': '#2E8FC8',
  'Negotiation': 'var(--gold-500)',
  'Done Deal': 'var(--success-600)',
  'Lost': 'var(--danger-600)',
};