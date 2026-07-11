import { NH48_RANGES } from "./nh48-ranges.js";

const PEAK_ALIASES = Object.freeze([
  ["mount hancock north peak", "Mount Hancock - North Peak."],
  ["mount hancock south peak", "Mount Hancock - South Peak."],
  ["mount hancock", "Mount Hancock"],
  ["north kinsman mountain", "North Kinsman Mountain"],
  ["south kinsman mountain", "South Kinsman Mountain"],
  ["north twin mountain", "North Twin Mountain"],
  ["south twin mountain", "South Twin Mountain"],
  ["wildcat mountain d peak", "Wildcat Mountain - D Peak."],
  ["wildcat mountain a peak", "Wildcat Mountain - A Peak."],
  ["middle carter mountain", "Middle Carter Mountain"],
  ["south carter mountain", "South Carter Mountain"],
  ["middle tripyramid", "Middle Tripyramid"],
  ["north tripyramid", "North Tripyramid"],
  ["mount washington", "Mount Washington"],
  ["mount passaconaway", "Mount Passaconaway"],
  ["mount moosilauke", "Mount Moosilauke"],
  ["mount carrigain", "Mount Carrigain"],
  ["mount eisenhower", "Mount Eisenhower"],
  ["mount lafayette", "Mount Lafayette"],
  ["mount lincoln", "Mount Lincoln"],
  ["mount jefferson", "Mount Jefferson"],
  ["mount madison", "Mount Madison"],
  ["mount osceola", "Mount Osceola"],
  ["mount liberty", "Mount Liberty"],
  ["mount moriah", "Mount Moriah"],
  ["mount pierce", "Mount Pierce"],
  ["mount garfield", "Mount Garfield"],
  ["mount field", "Mount Field"],
  ["mount flume", "Mount Flume"],
  ["mount willey", "Mount Willey"],
  ["mount whiteface", "Mount Whiteface"],
  ["mount tecumseh", "Mount Tecumseh"],
  ["mount isolation", "Mount Isolation"],
  ["mount jackson", "Mount Jackson"],
  ["mount monroe", "Mount Monroe"],
  ["mount tom", "Mount Tom"],
  ["mount waumbek", "Mount Waumbek"],
  ["mount cabot", "Mount Cabot"],
  ["mount hale", "Mount Hale"],
  ["mount bond", "Mount Bond"],
  ["galehead mountain", "Galehead Mountain"],
  ["zealand mountain", "Zealand Mountain"],
  ["owl's head", "Owl's Head"],
  ["owls head", "Owl's Head"],
  ["west bond", "West Bond"],
  ["bondcliff", "Bondcliff"],
  ["cannon mountain", "Cannon Mountain"],
  ["cannon mtn", "Cannon Mountain"],
  ["mt. cannon", "Cannon Mountain"],
  ["mt cannon", "Cannon Mountain"],
  ["mt. adams", "Mount Adams"],
  ["mt adams", "Mount Adams"],
  ["mt. madison", "Mount Madison"],
  ["mt madison", "Mount Madison"],
  ["mt. moriah", "Mount Moriah"],
  ["mt moriah", "Mount Moriah"],
  ["mt. washington", "Mount Washington"],
  ["mt washington", "Mount Washington"],
  ["north kinsman", "North Kinsman Mountain"],
  ["south kinsman", "South Kinsman Mountain"],
  ["north twin", "North Twin Mountain"],
  ["south twin", "South Twin Mountain"],
  ["south tripyramid", "South Tripyramid"],
  ["osceolas", "Mount Osceola"],
  ["mount percival", "Mount Percival"],
  ["mt percival", "Mount Percival"],
  ["mount morgan", "Mount Morgan"],
  ["mt morgan", "Mount Morgan"],
  ["red hill", "Red Hill"],
  ["mount pemigewasset", "Mount Pemigewasset"],
].sort((a, b) => b[0].length - a[0].length));

const EXTRA_RANGES = Object.freeze({
  "Mount Percival": "Squam Range",
  "Mount Morgan": "Squam Range",
  "Mount Pemigewasset": "Western White Mountains",
  "Red Hill": "Lakes Region",
  "Mount Hancock": "Pemigewasset Wilderness",
});

const AREA_ALIASES = Object.freeze([
  ["franconia ridge", "Franconia Ridge", "Franconia Range"],
  ["franconia range", "Franconia Range", "Franconia Range"],
  ["kinsman range", "Kinsman Range", "Kinsman Range"],
  ["presidential traverse", "Presidential Range", "Presidential Range"],
  ["presidential mountain range", "Presidential Range", "Presidential Range"],
  ["presidential range", "Presidential Range", "Presidential Range"],
  ["sandwich / waterville range", "Sandwich Range", "Sandwich / Waterville Range"],
  ["sandwich range", "Sandwich Range", "Sandwich / Waterville Range"],
  ["squam range", "Squam Range", "Squam Range"],
  ["percival morgan", "Squam Range", "Squam Range"],
  ["madison hut", "Madison Hut area", "Presidential Range"],
  ["monadnock vermont", "Monadnock, Vermont", ""],
  ["franconia notch", "Franconia Notch", "Franconia Range"],
  ["howker ridge", "Howker Ridge", "Presidential Range"],
  ["gulfside trail", "Presidential Range", "Presidential Range"],
  ["white mountains", "White Mountains", ""],
]);

const MULTI_PEAK_GROUPS = Object.freeze([
  { phrases: ["north and south kinsman", "north south kinsman"], peaks: ["North Kinsman Mountain", "South Kinsman Mountain"] },
  { phrases: ["whiteface and passaconaway", "whiteface passaconaway"], peaks: ["Mount Whiteface", "Mount Passaconaway"] },
  { phrases: ["lincoln and lafayette", "lincoln lafayette", "lafayette lincoln"], peaks: ["Mount Lafayette", "Mount Lincoln"] },
  { phrases: ["percival morgan", "morgan percival"], peaks: ["Mount Percival", "Mount Morgan"] },
  { phrases: ["tom field willey", "field willey"], peaks: ["Mount Tom", "Mount Field", "Mount Willey"] },
]);

function normalized(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function includesPhrase(text, phrase) {
  const value = normalized(text);
  const target = normalized(phrase);
  return value === target || value.includes(` ${target} `) || value.startsWith(`${target} `) || value.endsWith(` ${target}`);
}

function canonicalPeakName(value) {
  const valueText = normalized(value);
  const match = PEAK_ALIASES.find(([alias]) => valueText === alias);
  return match?.[1] ?? PEAK_ALIASES.find(([alias]) => includesPhrase(valueText, alias))?.[1] ?? "";
}

function extractPeakNames(text) {
  const found = [];
  const normalizedText = normalized(text);
  for (const group of MULTI_PEAK_GROUPS) {
    if (group.phrases.some((phrase) => includesPhrase(normalizedText, phrase))) found.push(...group.peaks);
  }
  for (const [alias, canonical] of PEAK_ALIASES) {
    if ((includesPhrase(text, alias) || includesPhrase(text, canonical)) && !found.includes(canonical)) found.push(canonical);
  }
  return found;
}

function rangeForPeak(peak) {
  return EXTRA_RANGES[peak] ?? NH48_RANGES[peak] ?? "";
}

function areaFromText(text) {
  for (const [phrase, label, range] of AREA_ALIASES) {
    if (includesPhrase(text, phrase)) return { label, range };
  }
  return undefined;
}

function friendlyRange(range, peakNames) {
  if (range === "Franconia Range") return "Franconia Ridge";
  if (range === "Sandwich / Waterville Range") return "Sandwich Range";
  if (range === "Pemigewasset Wilderness" && peakNames.every((peak) => ["Mount Bond", "West Bond", "Bondcliff"].includes(peak))) return "The Bonds";
  return range;
}

export function curateLocation({
  peakNames = [],
  inferredLabel = "",
  title = "",
  alt = "",
  routeLabel = "",
  tripLabel = "",
  broadPlace = "White Mountain National Forest",
} = {}) {
  const suppliedPeaks = [...new Set(peakNames.map(canonicalPeakName).filter(Boolean))];
  const text = [inferredLabel, title, alt, routeLabel, tripLabel].filter(Boolean).join(" ");
  const detectedPeaks = suppliedPeaks.length ? suppliedPeaks : extractPeakNames(text);
  const ranges = [...new Set(detectedPeaks.map(rangeForPeak).filter(Boolean))];
  const detectedArea = areaFromText(text);

  if (detectedPeaks.length > 1 && ranges.length === 1) {
    return {
      label: friendlyRange(ranges[0], detectedPeaks), peakNames: detectedPeaks,
      range: ranges[0], kind: "range", confidence: suppliedPeaks.length ? "high" : "medium",
    };
  }
  if (detectedPeaks.length > 1 && ranges.length > 1) {
    return {
      label: detectedArea?.label ?? "White Mountains", peakNames: detectedPeaks,
      range: detectedArea?.range ?? "", kind: "area", confidence: suppliedPeaks.length ? "high" : "medium",
    };
  }
  if (detectedPeaks.length === 1) {
    return {
      label: detectedPeaks[0], peakNames: detectedPeaks,
      range: rangeForPeak(detectedPeaks[0]), kind: "peak", confidence: suppliedPeaks.length ? "high" : "medium",
    };
  }
  if (detectedArea) {
    const kind = /Range|Ridge|Wilderness|Bonds/.test(detectedArea.label) ? "range" : "area";
    return { label: detectedArea.label, peakNames: [], range: detectedArea.range, kind, confidence: "medium" };
  }

  const safeLabel = String(inferredLabel || broadPlace).trim() || "White Mountain National Forest";
  return { label: safeLabel, peakNames: [], range: "", kind: "area", confidence: "low" };
}

export { canonicalPeakName, rangeForPeak };
