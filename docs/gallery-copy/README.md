# Photograph Copy Deck

This directory is the exact planning source for the 356 public photograph entries. It changes no site content by itself. During implementation, the values are transcribed into `content/photo-copy/2025.json` and `content/photo-copy/2026.json` without paraphrase.

## Coverage

The deck is split into twelve reviewable files:

1. `2025/001-031.md`
2. `2025/032-062.md`
3. `2025/063-093.md`
4. `2025/094-124.md`
5. `2026/001-029.md`
6. `2026/030-058.md`
7. `2026/059-087.md`
8. `2026/088-116.md`
9. `2026/117-145.md`
10. `2026/146-174.md`
11. `2026/175-203.md`
12. `2026/204-232.md`

Together they must contain 356 unique raw stable IDs and 356 unique canonical public IDs.

## Entry contract

Every entry contains these exact fields:

1. `Raw stable ID` is the unchanged private join key. It is not serialized publicly.
2. `Canonical public ID` is the collision checked slug of the raw stable ID.
3. `Future public path` contains the proposed title slug followed by the canonical public ID.
4. `Title` is unique across all 356 entries.
5. `Alt` describes visible subject and composition in 8 to 24 words and ends with a period.
6. `Caption` adds one grounded observation in no more than 32 words.
7. `Note` contains no more than 45 words or the exact value `Omit`.
8. `Year` is `2025` or `2026`.
9. `Season`, `Range`, `Outing ID`, `Outing label`, and `Collections` use exact public values or `Omit`.
10. `Place` is a required broad public location.
11. `Visual evidence` is `Verified at full frame on 2026-07-10.` only when the existing photograph was actually inspected.

`Omit` becomes an empty string or empty collection in the tracked JSON ledger. It never appears on the public site.

`Outing ID` is a safe future public route ID derived from the approved outing label. It never copies a private trip ID or contains an exact date. When distinct outings share one label, use consistent neutral suffixes such as `one` and `two`.

## Evidence standard

The reviewer inspects an existing 1400 pixel derivative at full frame. Landscape cards are checked at the current centered 3:2 crop. Portrait cards are checked at the current centered 4:5 crop and at the narrow 3:2 crop with the current 35 percent vertical position. The review checks visible subject, composition, weather, readable sign claims, orientation, and crop survival. A failed current crop is recorded in the main copy and UI audit and receives an exact replacement contract there. Place, range, outing, and season remain broad when the photograph alone does not establish greater precision.

An entry is not verified when its derivative could not be loaded or viewed. One unverified entry blocks implementation.

## Collection IDs

Only these assignments are valid:

1. `presidential-range`
2. `franconia-ridge`
3. `winter-forests`
4. `waterfalls`
5. `trail-details`
6. `sunrise-alpenglow`

Use `Omit` when none clearly fits.

## Privacy boundary

These files contain no source filename, source URL, exact date or time, coordinate, equipment value, serial, object key, private path, old generated prose, prompt, provenance, confidence, evidence field, or review state. Temporary visual review files stay under `.cache` and are not site assets.
