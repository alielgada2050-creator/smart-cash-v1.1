/* Smart Cash v1.0 — integrity layer: tamper-evident audit chain, invoice seals, idle auto-lock, verification. */
(function(){
const SC = window.SC, S0 = () => SC.S;
Object.assign(SCI18N.en,{au_ai:"AI analysis run",au_idle:"Auto-locked (idle)",au_seal:"Records sealed"});
Object.assign(SCI18N.ar,{au_ai:"تشغيل تحليل الذكاء الاصطناعي",au_idle:"قفل تلقائي (خمول)",au_seal:"ختم السجلات"});
const sha = async txt => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt)))].map(x=>x.toString(16).padStart(2,"0")).join("");
/* ---- audit chain: every entry carries h = SHA-256(prev.h | canonical entry). Newest entry is index 0. ---- */
const ent = e => JSON.stringify([e.t, e.by, e.ev, e.d]);
async function sealChain(){ const A = S0().audit; if(!A) return; let i = A.findIndex(e => e.h); if(i < 0) i = A.length;   // first sealed entry (newest sealed)
  for(let k = i-1; k >= 0; k--){ const prev = A[k+1] && A[k+1].h || "genesis"; A[k].h = await sha(prev + "|" + ent(A[k])) } }
SC.auditVerify = async () => { const A = S0().audit || []; let bad = -1, sealed = 0;
  for(let k = A.length-1; k >= 0; k--){ if(!A[k].h){ if(sealed) { bad = k; break } continue } sealed++;
    const prevE = A[k+1], prev = prevE && prevE.h || "genesis";
    if(!prevE) continue;                                      // oldest kept entry is the anchor (older ones may be trimmed)
    if(prevE && !prevE.h){ continue }                       // older unsealed history (before v1.0) is allowed
    if(A[k].h !== await sha(prev + "|" + ent(A[k]))){ bad = k; break } }
  return {ok: bad < 0, bad, sealed, total: A.length} };
/* ---- invoice seals: approved invoices are fingerprinted once; later edits are detected ---- */
const canon = i => JSON.stringify([i.id, i.total, i.vat, i.sub, i.sup, i.supName, i.invNo, i.date, i.cat, i.by, i.adv, i.branch, i.folder, i.seq]);
async function sealInvoices(){ for(const i of S0().invoices || []){ if(i.status === "approved" && !i.seal) i.seal = await sha(canon(i)) } }
SC.invoiceTampered = async () => { const out = []; for(const i of S0().invoices || []){ if(i.seal && i.seal !== await sha(canon(i))) out.push(i.id) } return out };
let busy = false; const baseSave = SC.save;
SC.save = function(){ baseSave.apply(this, arguments); if(busy || !S0() || !S0().audit) return; busy = true;
  Promise.resolve().then(async () => { const n0 = JSON.stringify(S0().audit.length) + S0().invoices.filter(i=>i.seal).length; await sealChain(); await sealInvoices(); if(JSON.stringify(S0().audit.length) + S0().invoices.filter(i=>i.seal).length !== n0 || true) baseSave.call(SC) }).catch(()=>{}).finally(() => { busy = false }) };
/* ---- idle auto-lock: 15 min without touch/keys signs the user out ---- */
const IDLE = 15*60*1000; let last = Date.now();
["pointerdown","keydown","touchstart","scroll"].forEach(ev => addEventListener(ev, () => { last = Date.now() }, {passive:true, capture:true}));
setInterval(() => { if(SC.S && SC.S.session && !SC.S.keepOpen && Date.now() - last > IDLE){ SC.audit("au_idle"); SC.S.session = null; SC.save(); SC.UI.stack = []; SC.UI.sheet = null; SC.UI.screen = "login"; SC.render() } }, 30000);
})();
