import { Application } from "../../types";
import { RawWalthamForestApplication } from "./client";
import { parseAddress } from "../../parsers/address";
import { classifyProposal } from "../../classifiers/proposal";

export function transformApplication(
  raw: RawWalthamForestApplication,
  borough: string,
  approximateDate: Date
): Application {
  const parsed = parseAddress(raw.location || "");
  const categories = classifyProposal(raw.proposal || "");

  return {
    reference_number: raw.reference,
    registration_date: approximateDate,
    application_type: raw.applicationType,
    proposal_description: raw.proposal,
    raw_address: raw.location,
    address_line_1: parsed.address_line_1,
    address_line_2: parsed.address_line_2,
    address_line_3: parsed.address_line_3,
    town: parsed.town,
    postcode: parsed.postcode,
    borough,
    proposal_category: categories,
    url: raw.reference
      ? `https://placehub.walthamforest.gov.uk/planning/index.html?fa=getApplication&id=${raw.reference}`
      : undefined,
  };
}
