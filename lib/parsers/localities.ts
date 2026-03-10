// Comprehensive list of London localities for town identification
// Includes all 32 borough names, major districts, and historic areas
const LONDON_LOCALITIES_LIST = [
  // Redbridge-specific (priority)
  "Ilford", "Wanstead", "Woodford", "Barkingside", "Goodmayes", "Seven Kings",
  "Chadwell Heath", "Hainault", "Gants Hill", "Newbury Park", "South Woodford",
  "Clayhall", "Loxford", "Fairlop", "Aldersbrook", "Cranbrook", "Redbridge",
  "Fullwell Cross", "Woodford Bridge", "Woodford Green", "Woodford Wells",
  "Snaresbrook", "Wanstead Flats", "Manor Park", "Little Ilford",

  // London Borough names
  "Barking", "Barnet", "Bexley", "Brent", "Bromley", "Camden",
  "City of London", "Croydon", "Ealing", "Enfield", "Greenwich",
  "Hackney", "Hammersmith", "Haringey", "Harrow", "Havering",
  "Hillingdon", "Hounslow", "Islington", "Kensington", "Kingston",
  "Lambeth", "Lewisham", "Merton", "Newham", "Richmond",
  "Southwark", "Sutton", "Tower Hamlets", "Waltham Forest", "Wandsworth",
  "Westminster",

  // Islington
  "Angel", "Archway", "Barnsbury", "Canonbury", "Clerkenwell",
  "Finsbury Park", "Highbury", "Holloway", "Pentonville", "Tufnell Park",
  "Upper Holloway", "Lower Holloway", "Caledonian",

  // Tower Hamlets
  "Bethnal Green", "Bow", "Bromley by Bow", "Canary Wharf", "Cubitt Town",
  "Hackney Wick", "Isle of Dogs", "Limehouse", "Mile End", "Millwall",
  "Old Ford", "Poplar", "Shadwell", "Stepney", "Wapping", "Whitechapel",
  "Spitalfields", "Aldgate", "Moorfields", "Globe Town", "Bow Common",
  "Lansbury", "St Katharines", "Ratcliff",

  // Hackney
  "Clapton", "Dalston", "De Beauvoir Town", "Homerton", "Hoxton",
  "Kingsland", "London Fields", "Shacklewell", "Shoreditch", "Stoke Newington",
  "Stamford Hill", "Upper Clapton", "Hackney Central", "Hackney Downs",
  "Springfield Park", "Cazenove", "Clissold",

  // Camden
  "Belsize Park", "Chalk Farm", "Gospel Oak", "Kentish Town",
  "Primrose Hill", "Swiss Cottage", "West Hampstead", "Frognal",
  "Fortune Green", "Hampstead Heath", "South Hampstead", "Kings Cross",
  "Somers Town", "Camden Town", "Maitland Park",

  // Newham
  "Beckton", "Canning Town", "Custom House", "East Ham", "Forest Gate",
  "Green Street", "Maryland", "Plaistow", "Silvertown", "Stratford",
  "Upton Park", "West Ham",

  // Waltham Forest
  "Chingford", "South Chingford", "Higham Hill", "Highams Park",
  "Leyton", "Leytonstone", "Walthamstow",

  // Barking & Dagenham
  "Dagenham", "Becontree", "Becontree Heath",
  "Marks Gate", "Rush Green", "Valence",

  // North / North-East London
  "Arnos Grove", "Bounds Green", "Cockfosters",
  "East Finchley", "Edmonton", "Finchley",
  "Highgate", "Hornsey", "Muswell Hill",
  "New Barnet", "New Southgate", "North Finchley", "Oakwood", "Ponders End",
  "Southgate", "Tottenham", "Turnpike Lane", "Wood Green",

  // East / South-East London (Lewisham + Greenwich)
  "Bermondsey", "Blackheath", "Borough", "Brockley", "Catford",
  "Charlton", "Deptford", "Elephant and Castle", "Eltham", "Forest Hill",
  "Hither Green", "Kidbrooke", "Lee", "New Cross", "Peckham",
  "Plumstead", "Rotherhithe", "Sydenham", "Thamesmead", "Woolwich",
  // Lewisham additions
  "New Cross Gate", "Bellingham", "Downham", "Grove Park", "Ladywell",
  "Telegraph Hill", "Crofton Park", "Honor Oak", "Nunhead",
  // Greenwich additions
  "Abbey Wood", "New Eltham", "Falconwood", "Welling", "Shooters Hill",
  "Eltham Park", "Coldharbour",

  // South London
  "Balham", "Battersea", "Brixton", "Clapham", "Colliers Wood",
  "Crystal Palace", "Herne Hill", "Norbury", "Norwood",
  "Penge", "South Norwood", "Streatham", "Thornton Heath",
  "Tooting", "Tulse Hill", "Vauxhall",

  // Richmond upon Thames
  "Barnes", "East Sheen", "Ham", "Hampton", "Hampton Wick",
  "Kew", "Mortlake", "North Sheen", "Petersham", "Richmond",
  "Roehampton", "Sheen", "St Margarets", "Teddington", "Twickenham",
  "Whitton",

  // South-West London (non-Richmond)
  "Chiswick", "Hammersmith", "Wimbledon", "Morden", "Mitcham",

  // West London (Ealing + Hounslow)
  "Acton", "Brentford", "Ealing", "Greenford", "Hanwell", "Hayes",
  "Heston", "Isleworth", "Northolt", "Perivale", "Southall",
  "Uxbridge", "West Ealing", "Yeading",
  // Ealing additions
  "Dormer's Wells", "South Ealing", "North Ealing", "Pitshanger",
  "Hobbayne", "Elthorne",

  // Central London
  "Belgravia", "Bloomsbury", "Chelsea", "City", "Covent Garden",
  "Fitzrovia", "Fulham", "Hampstead", "Holborn",
  "Kennington", "Kilburn", "Knightsbridge", "Marylebone", "Mayfair",
  "Paddington", "Pimlico", "Soho", "St Johns Wood", "St Pancras",
  "Victoria", "Waterloo",

  // North-West London (Brent + Barnet)
  "Brent Cross", "Burnt Oak", "Colindale", "Cricklewood", "Edgware",
  "Golders Green", "Hendon", "Kingsbury", "Mill Hill",
  "Neasden", "Queensbury", "Stanmore", "Wealdstone", "Wembley",
  "Willesden",
  // Brent additions
  "Harlesden", "Kensal Green", "North Wembley", "Alperton", "Stonebridge",
  "Brondesbury", "Tokyngton", "Sudbury", "Church End", "Fryent",
  "Barnhill", "Preston",

  // Generic
  "London",
];

// O(1) set for exact-match lookup (uppercase keys)
export const LONDON_LOCALITIES_SET: Set<string> = new Set(
  LONDON_LOCALITIES_LIST.map((l) => l.toUpperCase())
);

// Proper-case lookup: uppercase key → original cased value
export const LOCALITY_PROPER_CASE: Map<string, string> = new Map(
  LONDON_LOCALITIES_LIST.map((l) => [l.toUpperCase(), l])
);

// Pre-sorted longest-first for greedy partial matching
// ("SOUTH WOODFORD" matches before "WOODFORD")
export const LOCALITIES_SORTED: string[] = LONDON_LOCALITIES_LIST.map((l) =>
  l.toUpperCase()
).sort((a, b) => b.length - a.length);

export const LONDON_LOCALITIES_LIST_EXPORTED = LONDON_LOCALITIES_LIST;
