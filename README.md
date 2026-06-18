# Council Planning Tracker

Every week, thousands of homeowners across London apply to their local council for
planning permission: a loft conversion, a rear extension, a new build, a change of
use. Those applications are public, but they're scattered across dozens of council
websites, each with its own clunky search and its own quirks. For a builder,
architect, or any trade that wants to reach homeowners right when they're planning
work, finding them means checking site after site by hand.

Council Planning Tracker pulls all of that into one place. Pick the boroughs you
cover, choose a date range, and it fetches every newly registered application,
cleans up the messy address data, sorts it by the type of work, and lets you export
the lot to Excel. What used to be an afternoon of copy-pasting becomes a single
search.

<!-- Add a screenshot of the running app here, e.g. ![Council Planning Tracker](docs/screenshot.png) -->

## What it does

- **Searches many boroughs at once.** Sixteen London boroughs are supported today,
  spanning three different planning-portal systems behind a single interface.
- **Categorises the work.** Each application is tagged by job type (loft conversion,
  rear extension, new build, basement, change of use, and so on) using whole-word
  keyword matching, so a road called "A12" doesn't get mistaken for a Class A1 shop.
  The categories are grouped by how relevant they are to a builder, and a "buildable
  jobs only" toggle hides the admin noise (tree works, telecoms masts, advert
  consent) in one click.
- **Fills in the gaps.** Addresses from council portals are inconsistent, and many
  are missing a postcode. The app parses each address into clean fields and looks up
  missing postcodes so the data is ready to use.
- **Exports to Excel.** One click turns the results into a formatted spreadsheet you
  can drop straight into a CRM or mail-merge.
- **Streams results live.** Searches run borough by borough with a live progress
  view, and if one council's site is down the others still come through.

## Supported boroughs

Barnet, Bexley, Brent, Croydon, Ealing, Enfield, Greenwich, Islington, Kingston
upon Thames, Lewisham, Newham, Redbridge, Richmond upon Thames, Southwark, Tower
Hamlets, and Waltham Forest.

## How it works

Councils don't share a standard, so each planning portal is wrapped in an *adapter*
that exposes the same simple `search()` interface. Adding a council is usually just
a matter of registering it with the right adapter:

- **Agile Applications** portals expose a JSON API.
- **Idox Public Access** portals (the most common) are scraped from their HTML
  advanced-search results, handling sessions, CSRF tokens, and pagination.
- Anything bespoke gets its own adapter, like the custom one for Waltham Forest.

A search streams back to the browser over Server-Sent Events, so you see each
borough complete in real time instead of staring at a spinner. Results are cached in
memory for a few minutes, and missing postcodes are resolved through OpenStreetMap's
Nominatim with a Royal Mail fallback via postcodes.io.

The stack is Next.js (App Router) and React with TypeScript, styled with Tailwind.
Excel export is handled server-side with ExcelJS.

## Running it locally

You'll need Node 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Configuration is optional; copy `.env.example` to `.env.local` if you want to tweak
timeouts, caching, or the postcode-lookup limit.

## Tests

The address parser does the trickiest work, so it has its own test suite:

```bash
npm test
```

## Deploying

The app runs as a normal Node server and is set up to deploy to Railway out of the
box (`railway.json`). `npm run build` followed by `npm start` works on any host that
can run a long-lived Node process.

## Roadmap

What's coming next:

- **Sign in with Google.** Accounts so the tool can be shared, with each user's
  boroughs and preferences kept separate.
- **Send leaflets without leaving the app.** A [Stannp](https://www.stannp.com/)
  integration to pick a set of applications and post a physical leaflet straight to
  those addresses, in test mode first.
- **Email digests and saved searches.** Save a borough-and-job-type search and get a
  weekly email when new matching applications come in, so you don't have to remember
  to come back and re-run it.

Beyond that, a couple of boroughs (Hackney, Camden) run non-standard portals that
need their own adapters, and wider coverage across the rest of London is the longer
game.
