/* Smart Cash AI proxy — Cloudflare Worker. The OpenRouter key lives ONLY here, as an encrypted secret (OPENROUTER_API_KEY). Never in the app, the repo or chat.
   Deploy: see docs/AI_SETUP.md. */
const SYSTEM = {
  ar: "أنت محلل مالي خبير لتطبيق مصروفات وعهد. ستصلك إجماليات مجهولة فقط. اكتب بالعربية: 1) ملخص من 3 أسطر 2) أهم 5 ملاحظات أو مخاطر مرتبة بالأولوية 3) 5 اقتراحات عملية لتخفيض الصرف وتحسين الضبط. لا تخترع أرقامًا غير موجودة، وإذا كانت البيانات قليلة فاذكر ذلك. لا تطلب بيانات شخصية.",
  en: "You are an expert finance analyst for an expense & custody app. You receive anonymised totals only. Reply in English with: 1) a 3-line summary 2) the top 5 findings/risks ranked by priority 3) 5 practical recommendations to cut spend and tighten controls. Never invent numbers that are not provided; say so when data is thin. Never ask for personal data."
};
const hits = new Map();   // naive per-isolate rate limit; use Cloudflare Rate Limiting rules for real enforcement
export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allow = (env.ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
    const okOrigin = allow.length ? allow.includes(origin) : false;      // fail closed: ORIGINS must be set
    const cors = { "Access-Control-Allow-Origin": okOrigin ? origin : "null", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST" || !okOrigin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: cors });
    const ip = req.headers.get("CF-Connecting-IP") || "x", now = Date.now(), h = (hits.get(ip) || []).filter(t => now - t < 60000);
    if (h.length >= 6) return new Response(JSON.stringify({ error: "rate" }), { status: 429, headers: cors });
    h.push(now); hits.set(ip, h);
    const raw = await req.text(); if (raw.length > 60000) return new Response(JSON.stringify({ error: "too large" }), { status: 413, headers: cors });
    let body; try { body = JSON.parse(raw) } catch { return new Response(JSON.stringify({ error: "bad json" }), { status: 400, headers: cors }) }
    const lang = body.lang === "ar" ? "ar" : "en";
    const data = JSON.stringify({ currency: body.currency, plan: body.plan, summary: body.summary, findings: body.findings, cash: body.cash }).slice(0, 40000);
    const base = (env.AI_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "");   // any OpenAI-compatible server (OpenRouter by default)
    const r = await fetch(base + "/chat/completions", {
      method: "POST", headers: { "Authorization": "Bearer " + (env.AI_API_KEY || env.OPENROUTER_API_KEY), "Content-Type": "application/json", "X-Title": "Smart Cash" },
      body: JSON.stringify({ model: env.MODEL || "openrouter/auto", max_tokens: 900, temperature: 0.2, messages: [{ role: "system", content: SYSTEM[lang] }, { role: "user", content: data }] })
    });
    if (!r.ok) return new Response(JSON.stringify({ error: "upstream " + r.status }), { status: 502, headers: cors });
    const j = await r.json(); const text = j?.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ text }), { headers: { ...cors, "Content-Type": "application/json" } });
  }
};
