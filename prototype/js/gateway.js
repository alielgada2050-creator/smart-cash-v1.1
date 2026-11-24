/* Smart Cash v1.1 — payment gateway adapter layer.
   Smart Cash NEVER holds, moves or issues money (no SAMA licence needed). It only asks YOUR licensed provider (Moyasar, HyperPay, Tap, PayTabs...) to create a checkout link through YOUR proxy,
   then reconciles the status. No provider secret ever reaches the browser. Without SC_CONFIG.payEndpoint the links stay simulated (demo) and manual/IBAN flows keep working. */
(function(){
const SC = window.SC, CFG = window.SC_CONFIG || {}, EP = CFG.payEndpoint || "";
SC.gwLive = () => !!EP;
const baseURL = SC.plURL; SC.plURL = p => p.url || baseURL(p);
const call = async (path, body) => { const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 20000);
  try{ const r = await fetch(EP + path, body ? {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body), signal:ctl.signal, credentials:"omit"} : {signal:ctl.signal, credentials:"omit"});
    if(!r.ok) throw new Error("HTTP " + r.status); return await r.json() } finally { clearTimeout(to) } };
SC.payProvision = async (p) => { if(!EP || p.url || p.method === "bank") return;
  try{ const j = await call("/create", {gateway:p.gw, ref:p.id, amount:p.amt, currency:"SAR", description:(p.desc || p.id).slice(0, 120), expires:p.exp});
    if(typeof j.url === "string" && /^https:\/\//.test(j.url) && j.ext){ p.url = j.url; p.ext = String(j.ext).slice(0, 80); SC.save(); SC.render(true) } }catch(e){ p.gwErr = String(e.message).slice(0, 60); SC.save() } };
SC.paySync = async () => { if(!EP || !SC.S || !SC.S.paylinks) return 0; let n = 0;
  for(const p of SC.S.paylinks){ if(!p.ext || SC.plStatus(p) !== "pending") continue;
    try{ const j = await call("/status?gateway=" + encodeURIComponent(p.gw) + "&ext=" + encodeURIComponent(p.ext));
      if(j.status === "paid" && Math.abs(Number(j.amount) - p.amt) < 0.005 && j.currency === "SAR"){ if(!SC.plMarkPaid(p, "gateway")) n++ } }catch{} }
  if(n){ SC.save(); SC.render(true) } return n };
const baseCreate = SC.createPayLink;
SC.createPayLink = function(){ const r = baseCreate.apply(this, arguments); if(r && r.p && EP && r.p.method !== "bank") SC.payProvision(r.p); return r };
setInterval(() => { if(document.visibilityState === "visible") SC.paySync() }, 30000);
addEventListener("focus", () => SC.paySync());
/* ZATCA (Fatoora) phase-1 simplified-invoice QR payload: TLV (tag,length,value) in UTF-8, then Base64. Render it with any QR library. */
SC.zatcaTLV = (seller, vatNo, isoTime, total, vat) => { const enc = new TextEncoder(), parts = [seller, vatNo, isoTime, Number(total).toFixed(2), Number(vat).toFixed(2)].map((v, i) => { const b = enc.encode(String(v)); if(b.length > 255) throw new Error("tlv too long"); return [i + 1, b.length, ...b] });
  return btoa(String.fromCharCode(...parts.flat())) };
})();
