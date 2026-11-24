/* Smart Cash v1.1 — loads heavy libraries only when needed (Excel, ZIP, QR). In the production build they are served from ./vendor and are not in the page head. */
(function(){
const SC = window.SC, MAP = {XLSX:["vendor/xlsx.min.js","XLSX"], JSZip:["vendor/jszip.min.js","JSZip"], jsQR:["vendor/jsQR.js","jsQR"]}, P = {};
SC.lib = name => { const [src, g] = MAP[name]; if(window[g]) return Promise.resolve(true); if(P[name]) return P[name];
  return P[name] = new Promise(res => { const s = document.createElement("script"); s.src = src; s.async = true; s.onload = () => res(!!window[g]); s.onerror = () => { delete P[name]; res(false) }; document.head.appendChild(s) }) };
const wrap = (fn, libs) => { const base = SC[fn]; if(typeof base !== "function") return; SC[fn] = async function(){ await Promise.all(libs.map(SC.lib)); return base.apply(this, arguments) } };
wrap("exportAll", ["XLSX"]); wrap("backup", ["JSZip"]); wrap("restore", ["JSZip"]);
const prev = SC.afterRender; SC.afterRender = function(){ if(prev) prev.apply(this, arguments); if(["scan","reading","review"].includes(SC.UI.screen)) SC.lib("jsQR") };
/* non-core languages (10 files, ~650 KB) load only when selected */
const L = {};
const need = () => { const c = SC.ui.lang; if(c==="ar" || c==="en" || (window.SCI18N && SCI18N[c]) || L[c]) return; L[c] = 1;
  const s = document.createElement("script"); s.charset = "utf-8"; s.src = "js/i18n/" + c + ".js"; s.onload = () => SC.render(true); s.onerror = () => { delete L[c] }; document.head.appendChild(s) };
const prev2 = SC.afterRender; SC.afterRender = function(){ if(prev2) prev2.apply(this, arguments); need() };
})();
