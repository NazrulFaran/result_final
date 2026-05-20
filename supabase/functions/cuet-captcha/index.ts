import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BASE = "https://course.cuet.ac.bd";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Cache-Control": "max-age=0",
};

function parseSetCookie(headers: Headers): string {
  const raw = (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  const cookies: string[] =
    Array.isArray(raw) && raw.length
      ? raw
      : headers.get("set-cookie")
      ? [headers.get("set-cookie")!]
      : [];
  return cookies
    .map((c) => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}

function mergeCookies(existing: string, incoming: string): string {
  const jar = new Map<string, string>();
  for (const part of `${existing}; ${incoming}`.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    jar.set(trimmed.slice(0, eq), trimmed.slice(eq + 1));
  }
  return Array.from(jar, ([k, v]) => `${k}=${v}`).join("; ");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const pageRes = await fetch(`${BASE}/index.php`, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(12000),
    });

    if (!pageRes.ok && pageRes.status !== 200) {
      throw new Error(`CUET portal returned HTTP ${pageRes.status}.`);
    }

    const cookie1 = parseSetCookie(pageRes.headers);
    const pageHtml = await pageRes.text();

    const isRealChallenge =
      (pageHtml.includes("__cf_chl") || pageHtml.includes("cf-challenge-running")) &&
      !pageHtml.includes("loginuser");
    if (isRealChallenge) {
      throw new Error("The CUET portal is behind a Cloudflare challenge. Please try again in a moment.");
    }

    const csrfMatch = pageHtml.match(/name=["']csrf_token["'][^>]*value=["']([^"']+)["']/i);
    const csrf = csrfMatch?.[1] ?? "";

    const capRes = await fetch(`${BASE}/captcha.php`, {
      headers: {
        ...BROWSER_HEADERS,
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "same-origin",
        Cookie: cookie1,
        Referer: `${BASE}/index.php`,
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!capRes.ok) {
      throw new Error(`CUET portal returned HTTP ${capRes.status} for captcha image.`);
    }

    const buf = await capRes.arrayBuffer();
    const bytes = new Uint8Array(buf);

    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isGif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;

    if (!isPng && !isJpeg && !isGif) {
      throw new Error("Received unexpected response for captcha image. The CUET portal may be blocking this request.");
    }

    const mime = isPng ? "image/png" : isJpeg ? "image/jpeg" : "image/gif";
    const b64 = btoa(String.fromCharCode(...bytes));
    
    const cookie2 = parseSetCookie(capRes.headers);
    // Explicitly merge the initial landing page cookie with the captcha transaction cookie
    const combinedSessionCookie = mergeCookies(cookie1, cookie2);

    return new Response(
      JSON.stringify({ cookie: combinedSessionCookie, csrf, image: `data:${mime};base64,${b64}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
