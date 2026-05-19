import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BASE = "https://course.cuet.ac.bd";

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

function parseResultsHtml(html: string): { studentId?: string; name?: string; rows: ResultRow[] } {
  const rows: ResultRow[] = [];
  const tableRegex = /<table[\s\S]*?<\/table>/gi;
  const tables = html.match(tableRegex) ?? [];

  for (const tbl of tables) {
    const headerMatch = tbl.match(/<tr[\s\S]*?<\/tr>/i);
    if (!headerMatch) continue;
    const headerText = headerMatch[0].replace(/<[^>]+>/g, " ").toLowerCase();
    if (!headerText.includes("course code") || !headerText.includes("result")) continue;

    const rowRegex = /<tr[\s\S]*?<\/tr>/gi;
    const allRows = tbl.match(rowRegex) ?? [];
    for (const row of allRows.slice(1)) {
      const cellRegex = /<td[\s\S]*?<\/td>/gi;
      const cells = (row.match(cellRegex) ?? []).map((c) =>
        c.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      );
      if (cells.length < 6) continue;
      const [code, creditStr, levelTerm, sessional, grade, type] = cells;
      rows.push({
        code: code.trim(),
        credit: parseFloat(creditStr) || 0,
        levelTerm: levelTerm.trim(),
        sessional: /yes/i.test(sessional),
        grade: grade.replace(/\s/g, ""),
        type: type.trim(),
      });
    }
  }

  const bodyText = html.replace(/<[^>]+>/g, " ");
  const idMatch = bodyText.match(/Student\s*ID[:\s]*([0-9]+)/i);
  const nameMatch = bodyText.match(/Name[:\s]*([A-Za-z .]+?)(?:\s{2,}|$)/);
  return {
    studentId: idMatch?.[1],
    name: nameMatch?.[1]?.trim(),
    rows,
  };
}

function parseAdminHtml(html: string): {
  studentId?: string;
  name?: string;
  department?: string;
  batch?: string;
} {
  const info: Record<string, string> = {};
  const rowRegex = /<tr[\s\S]*?<\/tr>/gi;
  const rows = html.match(rowRegex) ?? [];
  for (const row of rows) {
    const cellRegex = /<(?:th|td)[\s\S]*?<\/(?:th|td)>/gi;
    const cells = (row.match(cellRegex) ?? []).map((c) =>
      c.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    );
    if (cells.length >= 2) {
      const key = cells[0].toLowerCase().replace(/[:*]/g, "").trim();
      if (key && cells[1]) info[key] = cells[1];
    }
  }

  const pick = (...keys: string[]) => {
    for (const kf of keys) {
      for (const k of Object.keys(info)) {
        if (k.includes(kf)) return info[k];
      }
    }
    return undefined;
  };

  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  let studentId = pick("student id", "student_id", "studentid", "user_email", "user id", "id no", "roll");
  let name = pick("student name", "full name", "name");
  const department = pick("department", "dept");
  const batch = pick("batch", "session", "series");

  if (!studentId) studentId = text.match(/Student\s*ID[:\s]*([0-9]+)/i)?.[1];
  if (!name) name = text.match(/Name[:\s]*([A-Za-z][A-Za-z .'-]{2,60})/)?.[1]?.trim();
  if (name && /^name$/i.test(name)) name = undefined;

  return { studentId, name, department, batch };
}

type ResultRow = {
  code: string;
  credit: number;
  levelTerm: string;
  sessional: boolean;
  grade: string;
  type: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { studentId, password, captcha, cookie, csrf } = await req.json();
    if (!studentId || !password || !captcha || !cookie) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required fields." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const form = new URLSearchParams();
    form.set("user_email", studentId);
    form.set("user_password", password);
    form.set("captcha", captcha);
    form.set("loginuser", "Sign In");
    if (csrf) form.set("csrf_token", csrf);

    const loginRes = await fetch(`${BASE}/index.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        Cookie: cookie,
        Referer: `${BASE}/index.php`,
      },
      body: form.toString(),
      redirect: "manual",
    });

    const newCookie = parseSetCookie(loginRes.headers);
    const mergedCookie = mergeCookies(cookie, newCookie);

    let html = "";
    if (loginRes.status >= 300 && loginRes.status < 400) {
      const loc = loginRes.headers.get("location") || `${BASE}/result_published.php`;
      const url = loc.startsWith("http") ? loc : `${BASE}/${loc.replace(/^\//, "")}`;
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", Cookie: mergedCookie } });
      html = await r.text();
    } else {
      html = await loginRes.text();
    }

    const resultsRes = await fetch(`${BASE}/result_published.php`, {
      headers: { "User-Agent": "Mozilla/5.0", Cookie: mergedCookie },
    });
    const resultsHtml = await resultsRes.text();
    const parsed = parseResultsHtml(resultsHtml);

    let profile: ReturnType<typeof parseAdminHtml> = {};
    try {
      const adminRes = await fetch(`${BASE}/admin.php`, {
        headers: { "User-Agent": "Mozilla/5.0", Cookie: mergedCookie },
      });
      const adminHtml = await adminRes.text();
      profile = parseAdminHtml(adminHtml);
    } catch {
      // optional
    }

    if (parsed.rows.length === 0) {
      const fallback = parseResultsHtml(html);
      if (fallback.rows.length === 0) {
        const lower = (html + resultsHtml).toLowerCase();
        let reason = "Login failed or no results found.";
        if (lower.includes("captcha")) reason = "Incorrect captcha. Please try again.";
        else if (lower.includes("password") || lower.includes("invalid"))
          reason = "Invalid student ID or password.";
        return new Response(
          JSON.stringify({ ok: false, error: reason }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({
          ok: true,
          ...fallback,
          studentId: profile.studentId ?? fallback.studentId,
          name: profile.name ?? fallback.name,
          department: profile.department,
          batch: profile.batch,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        ...parsed,
        studentId: profile.studentId ?? parsed.studentId,
        name: profile.name ?? parsed.name,
        department: profile.department,
        batch: profile.batch,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
