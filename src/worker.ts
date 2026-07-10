const MEDIA_ORIGIN = "https://photos.whitemountains.pictures";
const SITE_HOSTS = new Set(["whitemountains.pictures", "www.whitemountains.pictures"]);
const PHOTO_PATH = /^\/photos\/(2025|2026)\/originals\/([a-z0-9_-]+\.jpe?g)$/i;
const PRESET_PATH = /^\/images\/(thumb|card|hero|detail|social)\/(2025|2026)\/([a-z0-9_-]+\.jpe?g)$/i;

type ImageFormat = "avif" | "webp" | "jpeg" | "png";

interface ImagePreset {
  width: number;
  quality: number;
  format?: ImageFormat;
}

const IMAGE_PRESETS: Readonly<Record<string, ImagePreset>> = Object.freeze({
  thumb: { width: 320, quality: 78 },
  card: { width: 640, quality: 80 },
  hero: { width: 1280, quality: 82 },
  detail: { width: 2400, quality: 84 },
  social: { width: 1200, quality: 82, format: "jpeg" },
});

const LEGACY_WIDTHS = new Set([220, 320, 360, 520, 640, 760, 960, 1200, 1280, 1600, 2400]);
const LEGACY_QUALITIES = new Set([78, 80, 82, 84]);
const AUTO_FORMATS = new Set<ImageFormat>(["avif", "webp", "jpeg", "png"]);

export interface ParsedImageRequest {
  sourceUrl: URL;
  width: number;
  quality: number;
  format?: ImageFormat;
  cacheTag: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (url.hostname === "www.whitemountains.pictures" || url.protocol !== "https:") {
        const canonical = new URL(request.url);
        canonical.protocol = "https:";
        canonical.hostname = "whitemountains.pictures";
        return redirect(canonical, 308);
      }

      if (request.method !== "GET" && request.method !== "HEAD") {
        return withSecurityHeaders(
          Response.json(
            { error: "Method not allowed" },
            { status: 405, headers: { allow: "GET, HEAD", "cache-control": "no-store" } },
          ),
        );
      }

      if (url.pathname === "/healthz") {
        return withSecurityHeaders(
          Response.json(
            { status: "ok", service: "whitemountains-pictures", timestamp: new Date().toISOString() },
            { headers: { "cache-control": "no-store" } },
          ),
        );
      }

      const originalMatch = PHOTO_PATH.exec(url.pathname);
      if (originalMatch) {
        const [, year, filename] = originalMatch;
        if (!year || !filename) {
          return notFound();
        }
        const target = new URL(`/photos/${year}/originals/${filename.toLowerCase()}`, MEDIA_ORIGIN);
        return redirect(target, 308, "public, max-age=86400");
      }

      if (url.pathname === "/images/resize") {
        const parsed = parseLegacyResizeRequest(url, request.headers.get("accept") ?? "");
        if (!parsed.ok) {
          return withSecurityHeaders(
            Response.json({ error: parsed.error }, { status: 400, headers: { "cache-control": "no-store" } }),
          );
        }
        return transformImage(request, parsed.value);
      }

      const presetMatch = PRESET_PATH.exec(url.pathname);
      if (presetMatch) {
        const [, presetName, year, filename] = presetMatch;
        if (!presetName || !year || !filename) {
          return notFound();
        }
        const parsed = parsePresetRequest(presetName, year, filename, request.headers.get("accept") ?? "");
        if (!parsed) {
          return notFound();
        }
        return transformImage(request, parsed);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "request failed",
          method: request.method,
          path: url.pathname,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      return withSecurityHeaders(
        Response.json(
          { error: "Internal server error" },
          { status: 500, headers: { "cache-control": "no-store" } },
        ),
      );
    }
  },
} satisfies ExportedHandler<Env>;

export function parsePresetRequest(
  presetName: string,
  year: string,
  filename: string,
  accept: string,
): ParsedImageRequest | undefined {
  const preset = IMAGE_PRESETS[presetName];
  if (!preset || !/^(2025|2026)$/.test(year) || !/^[a-z0-9_-]+\.jpe?g$/i.test(filename)) {
    return undefined;
  }

  const format = preset.format ?? selectAutomaticFormat(accept);
  return {
    sourceUrl: new URL(`/photos/${year}/originals/${filename.toLowerCase()}`, MEDIA_ORIGIN),
    width: preset.width,
    quality: preset.quality,
    ...(format ? { format } : {}),
    cacheTag: `media-variant photo-${year}-${filename.replace(/\.jpe?g$/i, "").toLowerCase()}`,
  };
}

export function parseLegacyResizeRequest(
  url: URL,
  accept: string,
): { ok: true; value: ParsedImageRequest } | { ok: false; error: string } {
  const source = url.searchParams.get("src");
  if (!source) {
    return { ok: false, error: "Missing image src parameter" };
  }

  const sourceParts = parseAllowedPhotoSource(source, url);
  if (!sourceParts) {
    return { ok: false, error: "Unsupported image source" };
  }

  const width = parseInteger(url.searchParams.get("width"));
  if (!width || !LEGACY_WIDTHS.has(width)) {
    return { ok: false, error: "Unsupported image width" };
  }

  const quality = parseInteger(url.searchParams.get("quality") ?? "82");
  if (!quality || !LEGACY_QUALITIES.has(quality)) {
    return { ok: false, error: "Unsupported image quality" };
  }

  const requestedFormat = url.searchParams.get("format");
  let format: ImageFormat | undefined;
  if (requestedFormat && requestedFormat !== "auto") {
    if (!AUTO_FORMATS.has(requestedFormat as ImageFormat)) {
      return { ok: false, error: "Unsupported image format" };
    }
    format = requestedFormat as ImageFormat;
  } else {
    format = selectAutomaticFormat(accept);
  }

  return {
    ok: true,
    value: {
      sourceUrl: new URL(`/photos/${sourceParts.year}/originals/${sourceParts.filename}`, MEDIA_ORIGIN),
      width,
      quality,
      ...(format ? { format } : {}),
      cacheTag: `media-variant photo-${sourceParts.year}-${sourceParts.filename.replace(/\.jpe?g$/i, "")}`,
    },
  };
}

function parseAllowedPhotoSource(
  value: string,
  requestUrl: URL,
): { year: string; filename: string } | undefined {
  try {
    const parsed = value.startsWith("/") ? new URL(value, requestUrl.origin) : new URL(value);
    if (parsed.protocol !== "https:" && parsed.origin !== requestUrl.origin) {
      return undefined;
    }
    if (parsed.hostname !== "photos.whitemountains.pictures" && !SITE_HOSTS.has(parsed.hostname)) {
      return undefined;
    }
    const match = PHOTO_PATH.exec(parsed.pathname);
    const year = match?.[1];
    const filename = match?.[2]?.toLowerCase();
    return year && filename ? { year, filename } : undefined;
  } catch {
    return undefined;
  }
}

function parseInteger(value: string | null): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : undefined;
}

function selectAutomaticFormat(accept: string): ImageFormat | undefined {
  if (accept.includes("image/avif")) {
    return "avif";
  }
  if (accept.includes("image/webp")) {
    return "webp";
  }
  return undefined;
}

async function transformImage(request: Request, parsed: ParsedImageRequest): Promise<Response> {
  const imageResponse = await fetch(parsed.sourceUrl, {
    cf: {
      cacheEverything: true,
      cacheTtl: 60 * 60 * 24 * 30,
      image: {
        fit: "scale-down",
        width: parsed.width,
        quality: parsed.quality,
        sharpen: 1,
        ...(parsed.format ? { format: parsed.format } : {}),
      },
    },
    headers: {
      accept: request.headers.get("accept") ?? "image/avif,image/webp,image/*,*/*;q=0.8",
    },
  });

  if (!imageResponse.ok) {
    console.error(
      JSON.stringify({
        message: "image transformation failed",
        sourceStatus: imageResponse.status,
        source: parsed.sourceUrl.pathname,
        width: parsed.width,
      }),
    );
  }

  const headers = new Headers(imageResponse.headers);
  headers.set("cache-control", "public, max-age=86400");
  headers.set("cloudflare-cdn-cache-control", "max-age=2592000");
  headers.set("cache-tag", parsed.cacheTag);
  headers.set("x-content-type-options", "nosniff");
  headers.set("cross-origin-resource-policy", "cross-origin");
  if (!parsed.format) {
    headers.set("vary", "Accept");
  }

  return new Response(request.method === "HEAD" ? null : imageResponse.body, {
    status: imageResponse.status,
    statusText: imageResponse.statusText,
    headers,
  });
}

function redirect(target: URL, status: 301 | 302 | 303 | 307 | 308, cacheControl = "public, max-age=3600"): Response {
  return withSecurityHeaders(
    new Response(null, {
      status,
      headers: {
        location: target.toString(),
        "cache-control": cacheControl,
      },
    }),
  );
}

function notFound(): Response {
  return withSecurityHeaders(
    Response.json({ error: "Not found" }, { status: 404, headers: { "cache-control": "no-store" } }),
  );
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set(
    "permissions-policy",
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  );
  headers.set("content-security-policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
