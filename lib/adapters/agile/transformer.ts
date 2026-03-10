import { Application } from "../../types";
import { RawAgileApplication } from "./client";
import { parseAddress } from "../../parsers/address";
import { classifyProposal } from "../../classifiers/proposal";

export function transformApplication(
  raw: RawAgileApplication,
  borough: string,
  portalBaseUrl?: string
): Application {
  const parsed = parseAddress(raw.location || "");
  const categories = classifyProposal(raw.proposal || "");

  let registrationDate: Date;
  if (raw.registrationDate) {
    const d = new Date(raw.registrationDate);
    registrationDate = isNaN(d.getTime()) ? new Date() : d;
  } else {
    registrationDate = new Date();
  }

  return {
    reference_number: raw.reference || "",
    registration_date: registrationDate,
    application_type: raw.applicationType || "",
    proposal_description: raw.proposal || "",
    raw_address: raw.location || "",
    address_line_1: parsed.address_line_1,
    address_line_2: parsed.address_line_2,
    address_line_3: parsed.address_line_3,
    town: parsed.town,
    postcode: parsed.postcode,
    borough,
    proposal_category: categories,
    url:
      portalBaseUrl && raw.id
        ? `${portalBaseUrl}/application-details/${raw.id}`
        : undefined,
  };
}
