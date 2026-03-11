import { CouncilAdapter, SearchParams } from "../types";
import { Application } from "../../types";
import { AgileApplicationsClient } from "./client";
import { transformApplication } from "./transformer";

export class AgileAdapter implements CouncilAdapter {
  readonly councilId: string;
  readonly councilName: string;

  private client: AgileApplicationsClient;
  private readonly portalBaseUrl?: string;

  constructor(
    councilId: string,
    councilName: string,
    clientCode: string,
    portalBaseUrl?: string
  ) {
    this.councilId = councilId;
    this.councilName = councilName;
    this.client = new AgileApplicationsClient(clientCode, portalBaseUrl);
    this.portalBaseUrl = portalBaseUrl;
  }

  async search(
    params: SearchParams,
    onProgress?: (count: number) => void
  ): Promise<Application[]> {
    const raw = await this.client.search(
      params.dateFrom,
      params.dateTo,
      onProgress
    );
    return raw.map((item) =>
      transformApplication(item, this.councilName, this.portalBaseUrl)
    );
  }

  async healthCheck(): Promise<boolean> {
    return this.client.healthCheck();
  }
}
