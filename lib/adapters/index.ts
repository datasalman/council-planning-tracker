import { CouncilAdapter } from "./types";
import { AgileAdapter } from "./agile";
import { WalthamForestAdapter } from "./walthamforest";
import { IdoxAdapter } from "./idox";

// Each council we support is registered here. To add another council, find the
// planning portal it runs and plug in the matching adapter:
//   - Agile Applications councils use a JSON API (AgileAdapter)
//   - Idox Public Access councils share a common HTML search (IdoxAdapter)
//   - anything bespoke gets its own adapter (e.g. Waltham Forest)
const adapters = new Map<string, CouncilAdapter>([
  // Agile Applications portals
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

  // Bespoke portal
  ["walthamforest", new WalthamForestAdapter()],

  // Idox Public Access portals
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
  [
    "barnet",
    new IdoxAdapter(
      "barnet",
      "Barnet",
      "https://publicaccess.barnet.gov.uk/online-applications"
    ),
  ],
  [
    "southwark",
    new IdoxAdapter(
      "southwark",
      "Southwark",
      "https://planning.southwark.gov.uk/online-applications"
    ),
  ],
  [
    "croydon",
    new IdoxAdapter(
      "croydon",
      "Croydon",
      "https://publicaccess3.croydon.gov.uk/online-applications"
    ),
  ],
  [
    "enfield",
    new IdoxAdapter(
      "enfield",
      "Enfield",
      "https://planningandbuildingcontrol.enfield.gov.uk/online-applications"
    ),
  ],
  [
    "bexley",
    new IdoxAdapter(
      "bexley",
      "Bexley",
      "https://pa.bexley.gov.uk/online-applications"
    ),
  ],
  [
    "kingston",
    new IdoxAdapter(
      "kingston",
      "Kingston upon Thames",
      "https://publicaccess.kingston.gov.uk/online-applications"
    ),
  ],
  [
    "newham",
    new IdoxAdapter(
      "newham",
      "Newham",
      "https://pa.newham.gov.uk/online-applications"
    ),
  ],
]);

export interface CouncilInfo {
  id: string;
  name: string;
}

export const SUPPORTED_COUNCILS: CouncilInfo[] = [
  { id: "barnet", name: "Barnet" },
  { id: "bexley", name: "Bexley" },
  { id: "brent", name: "Brent" },
  { id: "croydon", name: "Croydon" },
  { id: "ealing", name: "Ealing" },
  { id: "enfield", name: "Enfield" },
  { id: "greenwich", name: "Greenwich" },
  { id: "islington", name: "Islington" },
  { id: "kingston", name: "Kingston upon Thames" },
  { id: "lewisham", name: "Lewisham" },
  { id: "newham", name: "Newham" },
  { id: "redbridge", name: "Redbridge" },
  { id: "richmond", name: "Richmond upon Thames" },
  { id: "southwark", name: "Southwark" },
  { id: "towerhamlets", name: "Tower Hamlets" },
  { id: "walthamforest", name: "Waltham Forest" },
];

export function getAdapter(councilId: string): CouncilAdapter {
  const adapter = adapters.get(councilId);
  if (!adapter) throw new Error(`Unknown council: ${councilId}`);
  return adapter;
}

export function getAllAdapters(): CouncilAdapter[] {
  return Array.from(adapters.values());
}
