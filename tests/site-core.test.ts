import { describe, expect, it } from "vitest";
import { normalize2025, normalize2026 } from "../scripts/site-core.mjs";

function record2025(capturedAt: string, season = "Fall") {
  return {
    identity: { photoId: "photo-094", filename: "IMG_6308.jpg", width: 6000, height: 4000 },
    ai: {
      output: {
        title: "Bull Moose Among Fir Trees in White Mountains Forest",
        headline: "Bull Moose Among Fir Trees",
        description: "A bull moose among fir trees.",
        extendedDescription: "A bull moose stands among fir trees in the White Mountains.",
        alt: "Bull moose standing among fir trees.",
        safeLocationName: "Presidential Range Forest",
        timeOfDay: "afternoon",
      },
    },
    normalized: {
      capturedAt,
      camera: "Canon EOS 5DS R",
      lens: "EF70-300mm",
      exposureTime: 0.01,
      fNumber: 5.6,
      focalLength: 300,
      iso: 800,
      dimensions: { width: 6000, height: 4000 },
      orientation: "landscape",
    },
    derived: { season },
    trip: {},
  };
}

const manifest2025 = {
  photoId: "photo-094",
  needsHumanReview: false,
  objectKeys: { image: "photos/2025/originals/img_6308.jpg" },
};

describe("site metadata normalization", () => {
  it("publishes canonical Autumn for legacy Fall records", () => {
    expect(normalize2025(record2025("2025-10-08"), manifest2025).season).toBe("Autumn");
    expect(normalize2026({ season: "fall" }, { needsHumanReview: true }).season).toBe("Autumn");
  });

  it("withholds a capture date that contradicts its archive year", () => {
    const photo = normalize2025(record2025("2026-07-08"), manifest2025);

    expect(photo.captureDate).toBe("");
    expect(photo.captureYearMismatch).toBe(true);
    expect(photo.approved).toBe(false);
    expect(photo.reviewReasons).toContain("Capture date does not match the 2025 archive year and is not published.");
  });

  it("preserves a capture date that matches its archive year", () => {
    const photo = normalize2025(record2025("2025-10-08"), manifest2025);

    expect(photo.captureDate).toBe("2025-10-08");
    expect(photo.captureYearMismatch).toBe(false);
  });

  it("publishes a curated location label and concise time metadata", () => {
    const photo = normalize2025(record2025("2025-10-08"), manifest2025);

    expect(photo.locationLabel).toBe("Presidential Range");
    expect(photo.peakRange).toBe("Presidential Range");
    expect(photo.timeOfDay).toBe("Afternoon");
  });

  it("generalizes multi-peak 2026 trips to their range", () => {
    const photo = normalize2026({
      title: "Franconia Ridge view",
      season: "Autumn",
      tripContext: { peakNames: ["Mount Lafayette", "Mount Lincoln"], dateCandidates: ["2026-09-30"] },
      location: { label: "White Mountains" },
      image: { width: 1000, height: 700, orientation: "landscape" },
      description: "A ridge view.",
      alt: "A ridge view.",
    }, { needsHumanReview: true });

    expect(photo.locationLabel).toBe("Franconia Ridge");
    expect(photo.peakNames).toEqual(["Mount Lafayette", "Mount Lincoln"]);
    expect(photo.peakRange).toBe("Franconia Range");
  });
});
