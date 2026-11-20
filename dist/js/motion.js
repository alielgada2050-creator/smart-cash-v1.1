/* Smart Cash v1.0 — subtle count-up on hero figures (once per screen visit, skipped for reduced-motion). */
(function(){
const SC = window.SC; if(!SC || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
let lastKey = "";
const base = SC.afterRender;
SC.afterRender = function(){ if(base) base.apply(this, arguments);
  const key = SC.UI.screen + "|" + (SC.UI.tab||""); if(key === lastKey) return; lastKey = key;
  document.querySelectorAll(".hero-big").forEach(el => { const tn = el.firstChild; if(!tn || tn.nodeType !== 3) return; const txt = tn.nodeValue.trim(), m = txt.match(/^(-?)([\d,]+)(?:\.(\d+))?$/); if(!m) return;
    const dec = (m[3]||"").length, end = parseFloat(m[2].replace(/,/g,"") + (m[3] ? "." + m[3] : "")); if(!isFinite(end) || end === 0) return;
    const t0 = performance.now(), D = 650;
    const step = now => { const p = Math.min(1, (now - t0)/D), v = end * (1 - Math.pow(1 - p, 3)); tn.nodeValue = (m[1] ? "-" : "") + v.toLocaleString("en-US", {minimumFractionDigits:dec, maximumFractionDigits:dec}); if(p < 1) requestAnimationFrame(step); else tn.nodeValue = txt };
    requestAnimationFrame(step) }) };
})();
