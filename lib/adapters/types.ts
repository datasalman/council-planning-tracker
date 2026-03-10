import { Application } from "../types";

export interface SearchParams {
  boroughs: string[];
  dateFrom: string; // ISO date "YYYY-MM-DD"
  dateTo: string;   // ISO date "YYYY-MM-DD"
  proposalTypes?: string[]; // undefined = all
}

export interface CouncilAdapter {
  councilId: string;
  councilName: string;
  search(params: SearchParams, onProgress?: (count: number) => void): Promise<Application[]>;
  healthCheck(): Promise<boolean>;
}
