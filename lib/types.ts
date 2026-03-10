export interface Application {
  reference_number: string;
  registration_date: Date;
  application_type: string;
  proposal_description: string;
  raw_address: string;
  address_line_1: string;
  address_line_2?: string;
  address_line_3?: string;
  town: string;
  postcode: string;
  borough: string;
  proposal_category: string[];
  url?: string;
}

export interface AddressParsed {
  address_line_1: string;
  address_line_2?: string;
  address_line_3?: string;
  town: string;
  postcode: string;
}
