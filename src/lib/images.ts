// Real image library for High-Fidelity Preview (Branding & Realistic Preview Experience).
// Topical stock photos keyed by role + industry. Every consumer pairs these with a
// brand-gradient fallback (see bgImage) so a failed/blocked photo never looks broken.

const U = "https://images.unsplash.com/photo-";
const Q = "q=70&auto=format&fit=crop";

/** Build a sized Unsplash url from a photo id. */
function u(id: string, w = 900, h = 600): string {
  return `${U}${id}?w=${w}&h=${h}&${Q}`;
}

export type ImageRole =
  | "hero"
  | "office"
  | "factory"
  | "executive"
  | "product"
  | "investor"
  | "news"
  | "esg"
  | "team";

// Pools of topical photos per role. Industry-specific heroes override the generic pool.
const POOL: Record<ImageRole, string[]> = {
  hero: [
    "1486406146926-c627a92ad1ab", // glass towers
    "1431540015161-0bf868a2d407", // modern architecture
    "1497366811353-6870744d04b2", // corporate office
  ],
  office: [
    "1497366754035-f200968a6e72", // office interior
    "1497366216548-37526070297c", // meeting room
    "1604328698692-f76ea9498e76", // open workspace
  ],
  factory: [
    "1581092160562-40aa08e78837", // industrial machinery
    "1565793298595-6a879b1d9492", // production line
    "1504917595217-d4dc5ebe6122", // plant interior
  ],
  executive: [
    "1560250097-0b93528c311a", // man, suit
    "1573497019940-1c28c88b4f3e", // woman, professional
    "1472099645785-5658abf4ff4e", // man, portrait
    "1580489944761-15a19d654956", // woman, portrait
  ],
  product: [
    "1505740420928-5e560c06d30e", // headphones
    "1523275335684-37898b6baf30", // watch
    "1526170375885-4d8ecf77b99f", // device
  ],
  investor: [
    "1559526324-4b87b5e36e44", // finance district
    "1611974789855-9c2a0a7236a3", // trading screens
    "1551288049-bebda4e38f71", // analytics dashboard
  ],
  news: [
    "1504711434969-e33886168f5c", // newspapers
    "1495020689067-958852a7765e", // writing / press
    "1585829365295-ab7cd400c167", // editorial desk
  ],
  esg: [
    "1466611653911-95081537e5b7", // solar panels
    "1497436072909-60f360e1d4b1", // forest canopy
    "1473341304170-971dccb5ac1e", // wind / green energy
  ],
  team: [
    "1521737604893-d14cc237f11d", // team meeting
    "1600880292203-757bb62b4baf", // collaboration
    "1542744173-8e7e53415bb0", // workshop
  ],
};

// Industry-tuned hero shots closest visual match to the sector.
const INDUSTRY_HERO: Record<string, string> = {
  "Energy & Power": "1466611653911-95081537e5b7",
  "Finance & Banking": "1559526324-4b87b5e36e44",
  "Industrial & Manufacturing": "1581092160562-40aa08e78837",
  "ESG & Sustainability": "1497436072909-60f360e1d4b1",
  "Listed Company (SET)": "1551288049-bebda4e38f71",
  "Technology & Digital": "1518770660439-4636190af475",
  "Healthcare & Pharma": "1576091160550-2173dba999ef",
  "Real Estate & Property": "1486406146926-c627a92ad1ab",
  "Consumer & Retail": "1441986300917-64674bd600d8",
  "Government & Public Sector": "1564507592333-c60657eea523",
};

/** Deterministic pick from a pool (stable per seed → no hydration fl/re-shuffle). */
function pick(pool: string[], seed: number): string {
  return pool[Math.abs(seed) % pool.length];
}

/**
 * Resolve a photo url for a role. `industry` tunes the hero; `seed` (e.g. card index)
 * varies which photo of the pool is shown so a grid isn't all identical.
 */
export function photo(role: ImageRole, industry = "", seed = 0, w = 900, h = 600): string {
  if (role === "hero" && INDUSTRY_HERO[industry]) return u(INDUSTRY_HERO[industry], w, h);
  return u(pick(POOL[role], seed), w, h);
}

/**
 * CSS background shorthand: photo layered over a brand gradient.
 * If the photo fails to load, the gradient (brand color) shows never a broken box.
 * `darken` adds a scrim so overlaid text stays readable.
 */
export function bgImage(url: string, gradient: string, darken = 0): string {
  const scrim = darken > 0 ? `linear-gradient(rgba(3,4,28,${darken}),rgba(3,4,28,${darken})), ` : "";
  return `${scrim}url("${url}"), ${gradient}`;
}
