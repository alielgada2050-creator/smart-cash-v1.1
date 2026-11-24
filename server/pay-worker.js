/* Smart Cash payment-gateway proxy — Cloudflare Worker. Holds the provider SECRET KEY (encrypted secret), never the browser.
   Smart Cash only asks for a hosted checkout link and reads its status; money flows customer -> your licensed provider -> your bank.
   Implemented: Moyasar (invoices API, Basic auth with secret key). Others (HyperPay, Tap, PayTabs, Geidea): add an adapter in ADAPTERS following the same 2-method shape.
   Verify every request/response field against the provider's current docs before going live. */
const ADAPTERS = {
  moyasar: {
    async create(env, { ref, amount, currency, description, expires }) {
      const r = await fetch("https://api.moyasar.com/v1/invoices", {
        method: "POST",
        headers: { "Authorization": "Basic " + btoa(env.MOYASAR_SECRET_KEY + ":"), "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Math.round(amount * 100), currency, description: `${description} (${ref})`.slice(0, 200), expired_at: expires, metadata: { ref } })
      });
      if (!r.ok) throw new Error("provider " + r.status);
      const j = await r.json(); return { url: j.url, ext: j.id };
    },
    async status(env, { ext }) {
      const r = await fetch("https://api.moyasar.com/v1/invoices/" + encodeURIComponent(ext), { headers: { "Authorization": "Basic " + btoa(env.MOYASAR_SECRET_KEY + ":") } });
      if (!r.ok) throw new Error("provider " + r.status);
      const j = await r.json(); return { status: j.status, amount: j.amount / 100, currency: j.currency };   // amount is in halalas
    }
  }
};
const hits = new Map();
export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "", allow = (env.ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
    const ok = allow.includes(origin);
    const cors = { "Access-Control-Allow-Origin": ok ? origin : "null", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" };
    const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (!ok) return json({ error: "forbidden" }, 403);
    const ip = req.headers.get("CF-Connecting-IP") || "x", now = Date.now(), h = (hits.get(ip) || []).filter(t => now - t < 60000);
    if (h.length >= 30) return json({ error: "rate" }, 429); h.push(now); hits.set(ip, h);
    const url = new URL(req.url);
    try {
      if (req.method === "POST" && url.pathname === "/create") {
        const raw = await req.text(); if (raw.length > 4000) return json({ error: "too large" }, 413);
        const b = JSON.parse(raw), ad = ADAPTERS[b.gateway];
        if (!ad || !(b.amount > 0) || b.amount > 1000000 || b.currency !== "SAR" || !/^PL-\d{6}$/.test(b.ref || "")) return json({ error: "bad request" }, 400);
        return json(await ad.create(env, b));
      }
      if (req.method === "GET" && url.pathname === "/status") {
        const ad = ADAPTERS[url.searchParams.get("gateway")], ext = url.searchParams.get("ext") || "";
        if (!ad || !/^[\w-]{8,80}$/.test(ext)) return json({ error: "bad request" }, 400);
        return json(await ad.status(env, { ext }));
      }
      return json({ error: "not found" }, 404);
    } catch (e) { return json({ error: "upstream" }, 502); }
  }
};
