import { describe, expect, it } from "vitest";
import { curateLocation } from "../src/location-curation.js";

describe("curated photo location labels", () => {
  it("uses the canonical peak and its NH48 range for a single peak", () => {
    expect(curateLocation({ peakNames: ["Cannon Mtn"] })).toMatchObject({
      label: "Cannon Mountain",
      peakNames: ["Cannon Mountain"],
      range: "Kinsman Range",
      kind: "peak",
    });
  });

  it("generalizes a multi-peak Franconia trip to Franconia Ridge", () => {
    expect(curateLocation({ peakNames: ["Mount Lafayette", "Mount Lincoln"] })).toMatchObject({
      label: "Franconia Ridge",
      range: "Franconia Range",
      kind: "range",
    });
  });

  it("keeps a known range when the image cannot support a specific peak", () => {
    expect(curateLocation({ inferredLabel: "White Mountain National Forest", title: "Sunset Over the Kinsman Range" })).toMatchObject({
      label: "Kinsman Range",
      range: "Kinsman Range",
      kind: "range",
    });
  });

  it("does not invent a peak for a generic forest detail", () => {
    expect(curateLocation({ inferredLabel: "White Mountain National Forest", title: "Moss and Fern Detail", alt: "Close-up of moss in a shaded forest" })).toMatchObject({
      label: "White Mountain National Forest",
      peakNames: [],
      kind: "area",
    });
  });

  it("recognizes multi-peak wording without requiring every title to repeat Mount", () => {
    expect(curateLocation({ title: "Sunset view from the North & South Kinsman hike" })).toMatchObject({
      label: "Kinsman Range",
      peakNames: ["North Kinsman Mountain", "South Kinsman Mountain"],
    });
  });
});
