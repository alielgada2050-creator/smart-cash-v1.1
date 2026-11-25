/* Smart Cash v1.2 — PC / tablet mode + appearance (font, size, density). Device-level prefs in localStorage `sc2.look`. */
(function(){
const SC = window.SC, V = SC.VIEWS, t = SC.t, ic = SC.h.ic, root = document.documentElement;
Object.assign(SCI18N.en,{lk_t:"Appearance & screen",lk_layout:"Layout",lk_auto:"Auto",lk_phone:"Phone",lk_pc:"PC / tablet",lk_font:"Font",lk_sys:"System",lk_size:"Text size",lk_dens:"Density",lk_cozy:"Comfortable",lk_compact:"Compact",lk_hint:"Saved on this device only"});
Object.assign(SCI18N.ar,{lk_t:"المظهر والشاشة",lk_layout:"العرض",lk_auto:"تلقائي",lk_phone:"جوال",lk_pc:"كمبيوتر / تابلت",lk_font:"الخط",lk_sys:"النظام",lk_size:"حجم النص",lk_dens:"الكثافة",lk_cozy:"مريح",lk_compact:"مضغوط",lk_hint:"يُحفظ على هذا الجهاز فقط"});
const KEY = "sc2.look", DEF = {layout:"auto", font:"sys", fs:"m", dens:"cozy"};
const load = () => { try{ return Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || "{}")) }catch{ return {...DEF} } };
SC.look = load();
const apply = () => { const L = SC.look, w = window.innerWidth;
  const pc = L.layout === "pc" || (L.layout === "auto" && w >= 900);
  root.classList.toggle("pc", pc);
  const set = (k, v, d) => v === d ? root.removeAttribute("data-" + k) : root.setAttribute("data-" + k, v);
  set("font", L.font, "sys"); set("fs", L.fs, "m"); set("dens", L.dens, "cozy") };
SC.setLook = (k, v) => { SC.look[k] = v; try{ localStorage.setItem(KEY, JSON.stringify(SC.look)) }catch{} apply(); SC.render(true) };
apply(); let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { const was = root.classList.contains("pc"); apply(); if(was !== root.classList.contains("pc")) SC.render(true) }, 120) });
const seg = (k, opts) => `<div class="mini-seg">${opts.map(([v, l]) => `<button data-act="look" data-k="${k}" data-v="${v}" aria-pressed="${SC.look[k] === v}">${l}</button>`).join("")}</div>`;
const baseMe = V.me;
V.me = () => { let h = baseMe(); if(!SC.me()) return h;
  const card = `<div class="glass list wpad"><div class="row"><span class="ico">${ic("grid" in SC.h.P ? "grid" : "settings", 20)}</span><div class="grow"><div class="t1">${t("lk_t")}</div><div class="t2">${t("lk_hint")}</div></div></div>
  <div class="row"><div class="grow t1">${t("lk_layout")}</div>${seg("layout", [["auto", t("lk_auto")], ["phone", t("lk_phone")], ["pc", t("lk_pc")]])}</div>
  <div class="row"><div class="grow t1">${t("lk_font")}</div>${seg("font", [["sys", t("lk_sys")], ["tajawal", "Tajawal"], ["cairo", "Cairo"], ["plex", "Plex"]])}</div>
  <div class="row"><div class="grow t1">${t("lk_size")}</div>${seg("fs", [["s", "A-"], ["m", "A"], ["l", "A+"], ["xl", "A++"]])}</div>
  <div class="row"><div class="grow t1">${t("lk_dens")}</div>${seg("dens", [["cozy", t("lk_cozy")], ["compact", t("lk_compact")]])}</div></div>`;
  const i = h.lastIndexOf('<div class="spacer">'); return i >= 0 ? h.slice(0, i) + card + h.slice(i) : h + card };
document.addEventListener("click", e => { const b = e.target.closest('[data-act="look"]'); if(!b) return; e.stopImmediatePropagation(); SC.setLook(b.dataset.k, b.dataset.v) }, true);
})();
