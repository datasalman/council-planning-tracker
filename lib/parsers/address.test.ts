import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAddress } from "./address";

// Cases drawn from real portal output across boroughs. Idox addresses arrive
// space-delimited, Agile ones comma-delimited, which is why the parser has to
// cope with both shapes.
const cases: Array<{
  name: string;
  raw: string;
  expect: {
    address_line_1?: string;
    address_line_2?: string;
    town?: string;
    postcode?: string;
  };
}> = [
  {
    name: "comma-delimited Agile address",
    raw: "106, The Glade, Ilford, IG5 0NL",
    expect: {
      address_line_1: "106",
      address_line_2: "The Glade",
      town: "Ilford",
      postcode: "IG5 0NL",
    },
  },
  {
    name: "street name containing a locality word keeps the real town",
    raw: "12 Oakwood Drive Edgware HA8 9LF",
    expect: { address_line_1: "12 Oakwood Drive", town: "Edgware", postcode: "HA8 9LF" },
  },
  {
    name: "landmark name starting with a locality is not treated as the town",
    raw: "Golders Green Crematorium Hoop Lane London NW11 7NL",
    expect: {
      address_line_1: "Golders Green Crematorium Hoop Lane",
      town: "London",
      postcode: "NW11 7NL",
    },
  },
  {
    name: "cemetery landmark keeps full address line",
    raw: "New Southgate Cemetery And Crematorium Brunswick Park Road London N11 1JJ",
    expect: {
      address_line_1: "New Southgate Cemetery And Crematorium Brunswick Park Road",
      town: "London",
      postcode: "N11 1JJ",
    },
  },
  {
    name: "simple numbered street, space-delimited",
    raw: "65 Oakleigh Avenue London N20 9JG",
    expect: { address_line_1: "65 Oakleigh Avenue", town: "London", postcode: "N20 9JG" },
  },
  {
    name: "borough name used as the town",
    raw: "54 Derwent Avenue Barnet EN4 8LZ",
    expect: { address_line_1: "54 Derwent Avenue", town: "Barnet", postcode: "EN4 8LZ" },
  },
  {
    name: "longest locality wins over its substring",
    raw: "5 Maybank Road South Woodford E18 1EN",
    expect: { address_line_1: "5 Maybank Road", town: "South Woodford", postcode: "E18 1EN" },
  },
  {
    name: "site-description prefix is stripped",
    raw: "Land at 23 High Road Leyton E10 5QH",
    expect: { address_line_1: "23 High Road", town: "Leyton", postcode: "E10 5QH" },
  },
  {
    name: "missing postcode still parses town and address",
    raw: "1 Station Road Twickenham",
    expect: { address_line_1: "1 Station Road", town: "Twickenham", postcode: "" },
  },
  {
    name: "empty input is handled",
    raw: "",
    expect: { address_line_1: "", town: "", postcode: "" },
  },
  {
    // A locality ("Ham") sitting at the very start of a segment ("Hampton
    // Court") without being a standalone word used to send the parser into an
    // infinite loop. This case completing at all is the real assertion.
    name: "locality at the start of a segment does not hang the parser",
    raw: "Teddington Weir, Teddington LockAnd Molesey Weir, Hampton Court",
    expect: { address_line_1: "Teddington Weir", postcode: "" },
  },
];

for (const c of cases) {
  test(c.name, () => {
    const got = parseAddress(c.raw);
    for (const [key, value] of Object.entries(c.expect)) {
      assert.equal(
        got[key as keyof typeof got],
        value,
        `${key}: expected "${value}", got "${got[key as keyof typeof got]}"`
      );
    }
  });
}
