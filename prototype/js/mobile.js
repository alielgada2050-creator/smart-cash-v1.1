/* Smart Cash v1.3.1 — phone ergonomics: sheets that follow the on-screen keyboard, 16px inputs (no iOS zoom), and
   "pick from phone contacts" (Contact Picker API on Android Chrome; .vcf file fallback elsewhere).
   Note: web apps cannot read the call log (no browser API) — contacts are the supported route. */
(function(){
const SC = window.SC, H = SC.h, t = SC.t, root = document.documentElement;
Object.assign(SCI18N.en,{ct_pick:"Pick from contacts",ct_vcf:"Import contact (.vcf)",ct_none:"Nothing selected",ct_filled:"Filled from contact"});
Object.assign(SCI18N.ar,{ct_pick:"اختيار من جهات الاتصال",ct_vcf:"استيراد جهة اتصال (.vcf)",ct_none:"لم يتم اختيار شيء",ct_filled:"تمت التعبئة من جهة الاتصال"});
/* keyboard-aware layout */
const vv = window.visualViewport;
const upd = () => { const ih = window.innerHeight, h = vv ? vv.height : ih, kb = vv ? Math.max(0, ih - h - vv.offsetTop) : 0;
  root.style.setProperty("--vvh", h + "px"); root.classList.toggle("kb", kb > 120 || h < ih * .75) };
if(vv){ vv.addEventListener("resize", upd); vv.addEventListener("scroll", upd) } window.addEventListener("resize", upd); upd();
document.addEventListener("focusin", e => { const el = e.target; if(!el.matches || !el.matches("input,select,textarea")) return;
  if(!el.hasAttribute("enterkeyhint")) el.setAttribute("enterkeyhint", el.matches("textarea") ? "enter" : "done");
  setTimeout(() => { try{ el.scrollIntoView({block:"center", behavior:"smooth"}) }catch{} }, 280) });
document.addEventListener("keydown", e => { if(e.key === "Enter" && e.target.matches && e.target.matches("input:not([type=checkbox]):not([type=file])")){ const sh = e.target.closest(".sheet"); const inputs = sh ? [...sh.querySelectorAll("input:not([type=hidden]),select,textarea")] : [];
  const i = inputs.indexOf(e.target); if(i >= 0 && i < inputs.length - 1){ e.preventDefault(); inputs[i + 1].focus() } else e.target.blur() } });
/* contacts */
const PHONE = ["f-phone", "sh-phone"], NAME = ["f-party", "f-newName", "sh-name", "f-name", "f-nameAr", "f-nameEn"];
const normPhone = p => { let d = String(p || "").replace(/[^\d+]/g, ""); if(d.startsWith("+966")) d = "0" + d.slice(4); else if(d.startsWith("00966")) d = "0" + d.slice(5); else if(d.startsWith("966") && d.length >= 12) d = "0" + d.slice(3); return d };
const setVal = (id, v) => { const el = document.getElementById(id); if(!el || !v) return; el.value = v; el.dispatchEvent(new Event("input", {bubbles:true})); el.dispatchEvent(new Event("change", {bubbles:true})) };
const fill = (name, tel) => { if(!name && !tel) return H.toast(t("ct_none")); const ph = PHONE.find(i => document.getElementById(i)); if(tel && ph) setVal(ph, normPhone(tel));
  const ns = NAME.filter(i => document.getElementById(i)); ns.forEach((i, k) => { const el = document.getElementById(i); if(name && (k === 0 || !el.value)) setVal(i, name) }); H.toast(t("ct_filled")) };
const parseVcf = txt => { const c = txt.split(/BEGIN:VCARD/i)[1] || txt, fn = /^FN[^:]*:(.+)$/im.exec(c), tel = /^TEL[^:]*:(.+)$/im.exec(c); return [fn && fn[1].trim(), tel && tel[1].trim()] };
function inject(){ const ph = PHONE.map(i => document.getElementById(i)).find(Boolean); if(!ph) return; const lab = ph.closest(".fld"); if(!lab || lab.previousElementSibling?.classList.contains("ct-row")) return;
  const row = document.createElement("div"); row.className = "ct-row";
  const can = !!(navigator.contacts && navigator.contacts.select);
  row.innerHTML = can ? `<button type="button" class="chip" data-act="pickct">${t("ct_pick")}</button>` : `<label class="chip">${t("ct_vcf")}<input type="file" accept=".vcf,text/vcard,text/x-vcard" hidden data-ct-file></label>`;
  lab.parentNode.insertBefore(row, lab) }
const base = SC.afterRender; SC.afterRender = function(){ if(base) base.apply(this, arguments); inject() };
document.addEventListener("click", async e => { const b = e.target.closest('[data-act="pickct"]'); if(!b) return; e.stopImmediatePropagation();
  try{ const r = await navigator.contacts.select(["name", "tel"], {multiple:false}); if(r && r[0]) fill((r[0].name || [])[0], (r[0].tel || [])[0]); else H.toast(t("ct_none")) }catch{ H.toast(t("ct_none")) } }, true);
document.addEventListener("change", async e => { const f = e.target.closest && e.target.matches("[data-ct-file]") ? e.target : null; if(!f || !f.files[0]) return; const [n, tl] = parseVcf(await f.files[0].text()); fill(n, tl); f.value = "" }, true);
})();
