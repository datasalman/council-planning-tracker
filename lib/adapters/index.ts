import { CouncilAdapter } from "./types";
import { AgileAdapter } from "./agile";
import { WalthamForestAdapter } from "./walthamforest";
import { IdoxAdapter } from "./idox";

// Adapter registry — add new councils here
const adapters = new Map<string, CouncilAdapter>([
  // ── Agile Applications ────────────────────────────────────────────────────
  [
    "redbridge",
    new AgileAdapter(
      "redbridge",
      "Redbridge",
      "REDBRIDGE",
      "https://planning.redbridge.gov.uk/redbridge"
    ),
  ],
  [
    "islington",
    new AgileAdapter(
      "islington",
      "Islington",
      "IS",
      "https://planning.agileapplications.co.uk/islington"
    ),
  ],
  [
    "richmond",
    new AgileAdapter(
      "richmond",
      "Richmond upon Thames",
      "RICHMONDUPONTHAMES",
      "https://planning.richmond.gov.uk/richmond"
    ),
  ],

  // ── Custom scrapers ───────────────────────────────────────────────────────
  ["walthamforest", new WalthamForestAdapter()],

  // ── Idox Public Access ────────────────────────────────────────────────────
  [
    "towerhamlets",
    new IdoxAdapter(
      "towerhamlets",
      "Tower Hamlets",
      "https://development.towerhamlets.gov.uk/online-applications"
    ),
  ],
  [
    "lewisham",
    new IdoxAdapter(
      "lewisham",
      "Lewisham",
      "https://planning.lewisham.gov.uk/online-applications"
    ),
  ],
  [
    "brent",
    new IdoxAdapter(
      "brent",
      "Brent",
      "https://pa.brent.gov.uk/online-applications"
    ),
  ],
  [
    "greenwich",
    new IdoxAdapter(
      "greenwich",
      "Greenwich",
      "https://planning.royalgreenwich.gov.uk/online-applications"
    ),
  ],
  [
    "ealing",
    new IdoxAdapter(
      "ealing",
      "Ealing",
      "https://pam.ealing.gov.uk/online-applications"
    ),
  ],
]);

export interface CouncilInfo {
  id: string;
  name: string;
}

export const SUPPORTED_COUNCILS: CouncilInfo[] = [
  { id: "redbridge", name: "Redbridge" },
  { id: "islington", name: "Islington" },
  { id: "richmond", name: "Richmond upon Thames" },
  { id: "walthamforest", name: "Waltham Forest" },
  { id: "towerhamlets", name: "Tower Hamlets" },
  { id: "lewisham", name: "Lewisham" },
  { id: "brent", name: "Brent" },
  { id: "greenwich", name: "Greenwich" },
  { id: "ealing", name: "Ealing" },
];

export function getAdapter(councilId: string): CouncilAdapter {
  const adapter = adapters.get(councilId);
  if (!adapter) throw new Error(`Unknown council: ${councilId}`);
  return adapter;
}

export function getAllAdapters(): CouncilAdapter[] {
  return Array.from(adapters.values());
}
