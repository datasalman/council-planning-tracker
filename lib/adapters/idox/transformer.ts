import { Application } from "../../types";
import { RawIdoxApplication } from "./client";
import { parseAddress } from "../../parsers/address";
import { classifyProposal } from "../../classifiers/proposal";

/** Parse Idox date strings like "19 Feb 2026" or "Thu 19 Feb 2026". */
function parseIdoxDate(raw: string): Date {
  if (!raw) return new Date();
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function transformApplication(
  raw: RawIdoxApplication,
  borough: string,
  baseUrl: string
): Application {
  const parsed = parseAddress(raw.location || "");
  const categories = classifyProposal(raw.description || "");

  const url = raw.keyVal
    ? `${baseUrl}/applicationDetails.do?activeTab=summary&keyVal=${encodeURIComponent(raw.keyVal)}`
    : undefined;

  return {
    reference_number: raw.reference,
    registration_date: parseIdoxDate(raw.receivedDate),
    application_type: raw.applicationType,
    proposal_description: raw.description,
    raw_address: raw.location,
    address_line_1: parsed.address_line_1,
    address_line_2: parsed.address_line_2,
    address_line_3: parsed.address_line_3,
    town: parsed.town,
    postcode: parsed.postcode,
    borough,
    proposal_category: categories,
    url,
  };
}
