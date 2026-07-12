export interface LeadFilter {
  pageNumber: number;
  pageSize: number;
  search?: string;
  status?: number|null;
  source?: number|null;
  customerType?: number|null;
  regionId?: string | null;
  constructionStage?: string | null;
 stage?:number|null;
 name?:string;
}
