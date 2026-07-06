const NO_REDIRECT_HOST_SUFFIXES = [".workers.dev", ".pages.dev"];
const HTMLISH_EXTENSIONS = new Set([".html", ".xml", ".txt"]);

function hasFileExtension(pathname) {
  const segment = pathname.split("/").pop() || "";
  return segment.includes(".");
}

function shouldRedirectHost(host, canonicalHost) {
  if (!canonicalHost) {
    return false;
  }

  const normalizedHost = host.toLowerCase();
  const normalizedCanonical = canonicalHost.toLowerCase();

  if (
    normalizedHost === normalizedCanonical ||
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost.endsWith(".localhost")
  ) {
    return false;
  }

  if (NO_REDIRECT_HOST_SUFFIXES.some((suffix) => normalizedHost.endsWith(suffix))) {
    return false;
  }

  return normalizedHost === `www.${normalizedCanonical}`;
}

function buildRedirectUrl(url, env) {
  const nextUrl = new URL(url.toString());
  nextUrl.protocol = `${env.CANONICAL_SCHEME || "https"}:`;
  nextUrl.host = env.CANONICAL_HOST;
  return nextUrl.toString();
}

function isHtmlLike(pathname, contentType = "") {
  if (contentType.includes("text/html") || contentType.includes("application/xml") || contentType.includes("text/plain")) {
    return true;
  }

  if (!hasFileExtension(pathname)) {
    return true;
  }

  return [...HTMLISH_EXTENSIONS].some((extension) => pathname.endsWith(extension));
}

function withHeaders(request, response) {
  const pathname = new URL(request.url).pathname;
  const headers = new Headers(response.headers);
  const contentType = headers.get("content-type") || "";

  if (isHtmlLike(pathname, contentType)) {
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  } else {
    headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
  }

  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (shouldRedirectHost(url.host, env.CANONICAL_HOST)) {
      return Response.redirect(buildRedirectUrl(url, env), 301);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    return withHeaders(request, assetResponse);
  }
};

