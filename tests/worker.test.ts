/// <reference types="@cloudflare/vitest-pool-workers/types" />
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { parseLegacyResizeRequest, parsePresetRequest } from "../src/worker";

describe("canonical routing", () => {
  it("does not redirect an HTTPS visitor when Cloudflare uses an internal HTTP URL", async () => {
    const response = await exports.default.fetch(new Request(
      "http://whitemountains.pictures/healthz",
      { headers: { "x-forwarded-proto": "https" }, redirect: "manual" },
    ));

    expect(response.status).toBe(200);
  });

  it("redirects www to HTTPS apex while preserving the path and query", async () => {
    const response = await exports.default.fetch(new Request(
      "http://www.whitemountains.pictures/photos/2026/?season=spring",
      { redirect: "manual" },
    ));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://whitemountains.pictures/photos/2026/?season=spring");
  });

  it("redirects legacy originals to the R2 custom domain", async () => {
    const response = await exports.default.fetch(new Request(
      "https://whitemountains.pictures/photos/2025/originals/0B3A0057.jpg",
      { redirect: "manual" },
    ));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://photos.whitemountains.pictures/photos/2025/originals/0b3a0057.jpg");
  });

  it("redirects HTTP apex requests to HTTPS", async () => {
    const response = await exports.default.fetch(new Request(
      "http://whitemountains.pictures/about/photo-metadata/?ref=test",
      { redirect: "manual" },
    ));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://whitemountains.pictures/about/photo-metadata/?ref=test");
  });

  it("rejects state-changing methods", async () => {
    const response = await exports.default.fetch(new Request(
      "https://whitemountains.pictures/photos/",
      { method: "POST" },
    ));

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
  });

  it("serves an uncacheable health response with security headers", async () => {
    const response = await exports.default.fetch("https://whitemountains.pictures/healthz");
    const body = await response.json<{ status: string }>();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});

describe("bounded image variants", () => {
  it("maps a named preset to the R2 custom-domain original", () => {
    const parsed = parsePresetRequest("card", "2026", "IMG_0033.jpg", "image/avif,image/webp");

    expect(parsed).toMatchObject({ width: 640, quality: 80, format: "avif" });
    expect(parsed?.sourceUrl.toString()).toBe("https://photos.whitemountains.pictures/photos/2026/originals/img_0033.jpg");
  });

  it("rejects arbitrary presets, filenames, and years", () => {
    expect(parsePresetRequest("huge", "2026", "img_0033.jpg", "image/avif")).toBeUndefined();
    expect(parsePresetRequest("card", "2030", "img_0033.jpg", "image/avif")).toBeUndefined();
    expect(parsePresetRequest("card", "2026", "../secret.jpg", "image/avif")).toBeUndefined();
  });

  it("rejects SSRF sources and unbounded transform parameters", () => {
    const requestUrl = new URL("https://whitemountains.pictures/images/resize?src=https://example.com/private.jpg&width=640");
    expect(parseLegacyResizeRequest(requestUrl, "image/webp")).toEqual({ ok: false, error: "Unsupported image source" });

    const oversized = new URL("https://whitemountains.pictures/images/resize?src=/photos/2026/originals/img_0033.jpg&width=9999");
    expect(parseLegacyResizeRequest(oversized, "image/webp")).toEqual({ ok: false, error: "Unsupported image width" });
  });
});
