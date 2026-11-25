/* Smart Cash v1.2 — two-way Google Drive sync (phone <-> computer), per Google account, in the hidden app-data folder.
   Modes: off | instant (a few seconds after each change) | hourly (+ on open / on return to the app).
   Honest limits: Drive is a shared file, not a database — records are merged by id (local wins), deletions don't propagate,
   and a pre-merge snapshot is kept so a bad merge can be undone. Disabled inside the sample account. */
(function(){
const SC = window.SC, H = SC.h, V = SC.VIEWS, UI = SC.UI, t = SC.t, esc = SC.esc, ic = H.ic;
Object.assign(SCI18N.en,{sy_t:"Sync across devices",sy_off:"Off",sy_inst:"Instant",sy_hour:"Hourly",sy_now:"Sync now",sy_last:"Last sync: {d}",sy_never:"Not synced yet",sy_hint:"Phone and computer share one backup in your own Google Drive.",sy_pause:"Sync paused — tap Sync now to reconnect Google",sy_ok:"Synced",sy_merged:"Synced and merged with the other device",sy_undo:"Undo last merge",sy_undone:"Merge undone",sy_nog:"Link Google first",sy_busy:"Syncing…"});
Object.assign(SCI18N.ar,{sy_t:"مزامنة الأجهزة",sy_off:"إيقاف",sy_inst:"فورية",sy_hour:"كل ساعة",sy_now:"زامن الآن",sy_last:"آخر مزامنة: {d}",sy_never:"لم تتم المزامنة بعد",sy_hint:"الجوال والكمبيوتر يشتركان في نسخة واحدة داخل Google Drive الخاص بك.",sy_pause:"المزامنة متوقفة — اضغط «زامن الآن» لإعادة ربط Google",sy_ok:"تمت المزامنة",sy_merged:"تمت المزامنة ودمج بيانات الجهاز الآخر",sy_undo:"تراجع عن آخر دمج",sy_undone:"تم التراجع عن الدمج",sy_nog:"اربط Google أولًا",sy_busy:"جارٍ المزامنة…"});
const SKIP = new Set(["users","session","guard","drive","driveAuto","sync","audit","v","plan","clean"]);   // never merged: security + per-device state
const stamp = o => String(o && (o.upd || o.t || o.at || o.date || "") || "");
const mergeState = (L, R) => { let changed = false;
  for(const k of Object.keys(R)){ if(SKIP.has(k)) continue; const a = L[k], b = R[k];
    if(Array.isArray(b) && b.length && typeof b[0] === "object" && b[0] && "id" in b[0]){
      const A = Array.isArray(a) ? a : (L[k] = []), idx = new Map(A.map(x => [x && x.id, x]));
      for(const r of b){ if(!r || typeof r !== "object") continue; const m = idx.get(r.id); if(!m){ A.push(r); idx.set(r.id, r); changed = true } else if(stamp(r) > stamp(m) && JSON.stringify(r) !== JSON.stringify(m)){ A[A.indexOf(m)] = r; idx.set(r.id, r); changed = true } }
    } else if(k === "seq" && b && typeof b === "object"){ L.seq = L.seq || {}; for(const n of Object.keys(b)) if((+b[n] || 0) > (+L.seq[n] || 0)){ L.seq[n] = +b[n]; changed = true } }
    else if(a === undefined){ L[k] = b; changed = true } }
  return changed };
const name = () => `smartcash-${SC.wsKey()}.json`;
const q = () => encodeURIComponent(`name='${name()}' and trashed=false`);
const meta = async () => (await (await SC.gApi(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q()}&fields=files(id,modifiedTime)&orderBy=modifiedTime desc&pageSize=1`)).json()).files[0] || null;
const pull = async f => { const d = await (await SC.gApi(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`)).json(); return d && d.app === "smart-cash" && d.state && d.state.v === window.SCDATA.VERSION ? d.state : null };
const push = async (f) => { const S = SC.S, blob = new Blob([JSON.stringify({app:"smart-cash", v:S.v, at:SC.now(), ws:SC.wsKey(), state:{...S, session:null}})], {type:"application/json"}), b = "scs" + Date.now();
  const body = new Blob([`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(f ? {} : {name:name(), parents:["appDataFolder"]})}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n`, blob, `\r\n--${b}--`]);
  return (await SC.gApi("https://www.googleapis.com/upload/drive/v3/files" + (f ? "/" + f.id : "") + "?uploadType=multipart&fields=id,modifiedTime", {method:f ? "PATCH" : "POST", headers:{"Content-Type":"multipart/related; boundary=" + b}, body})).json() };
let running = false, applying = false;
const st = () => (SC.S.sync = SC.S.sync || {mode:"off", at:null, rm:null, dirty:false});
SC.syncNow = async (silent) => { if(SC.demo || running || !SC.S || !SC.me()) return null; if(!SC.gToken) return "sy_nog"; if(silent && !SC.gHasToken()) { UI.syncPaused = true; return null }
  running = true; UI.busy = silent ? UI.busy : "sy"; if(!silent) SC.render(true);
  try{ const s = st(), f = await meta(); let merged = false;
    if(f && f.modifiedTime !== s.rm){ const R = await pull(f);
      if(R){ if(!s.dirty && s.rm){ const sess = SC.S.session, sy = SC.S.sync, dr = SC.S.drive; SC.S = R; SC.S.session = sess; SC.S.sync = sy; SC.S.drive = dr; SC.reindex(); merged = true }
        else { try{ localStorage.setItem("sc2.premerge." + SC.wsKey(), JSON.stringify(SC.S)) }catch{} merged = mergeState(SC.S, R); if(merged) SC.reindex() } } }
    if(!f || s.dirty || merged){ const r = await push(f); s.rm = r.modifiedTime; s.dirty = false } else s.rm = f.modifiedTime;
    s.at = SC.now(); UI.syncPaused = false; applying = true; SC.save(); applying = false;
    if(merged) SC.audit("au_restore", "sync"); return merged ? "sy_merged" : "sy_ok" }
  catch(e){ UI.syncPaused = true; return "g_err:" + String(e.message || e).slice(0, 90) }
  finally{ running = false; if(UI.busy === "sy") UI.busy = null; if(!silent) SC.render(true) } };
SC.syncUndo = () => { const raw = localStorage.getItem("sc2.premerge." + SC.wsKey()); if(!raw) return false; const sess = SC.S.session, sy = SC.S.sync; SC.S = JSON.parse(raw); SC.S.session = sess; SC.S.sync = {...(sy || {}), dirty:true}; SC.reindex(); SC.save(); localStorage.removeItem("sc2.premerge." + SC.wsKey()); return true };
/* triggers */
const baseSave = SC.save; let tmr = null;
SC.save = () => { baseSave(); if(applying || SC.demo || !SC.S) return; const s = st(); if(s.mode === "off") return; s.dirty = true; if(s.mode === "instant"){ clearTimeout(tmr); tmr = setTimeout(() => SC.syncNow(true).then(r => { if(r) H.toast(r.startsWith("g_err") ? t("g_err", {m:r.slice(6)}) : t(r), r.startsWith("g_err")) }), 4000) } };
const tick = () => { if(SC.demo || !SC.S || !SC.me() || st().mode === "off" || document.hidden) return; const s = st(), age = s.at ? Date.now() - new Date(s.at).getTime() : Infinity;
  if(s.mode === "instant" || age > 3600e3) SC.syncNow(true) };
setInterval(tick, 5 * 60e3); document.addEventListener("visibilitychange", tick); window.addEventListener("online", tick); window.addEventListener("focus", tick); setTimeout(tick, 4000);
/* UI */
const baseMe = V.me;
V.me = () => { let h = baseMe(); const me = SC.me(); if(!me || SC.demo || !(window.SC_CONFIG && SC_CONFIG.googleClientId)) return h; const s = st(), busy = UI.busy === "sy";
  const seg = `<div class="mini-seg">${[["off","sy_off"],["instant","sy_inst"],["hourly","sy_hour"]].map(([v, l]) => `<button data-act="symode" data-v="${v}" aria-pressed="${s.mode === v}">${t(l)}</button>`).join("")}</div>`;
  const card = `<div class="glass list wpad"><div class="row"><span class="ico">${ic("up", 20)}</span><div class="grow"><div class="t1">${t("sy_t")}</div><div class="t2">${t("sy_hint")}</div></div></div>
  <div class="row"><div class="grow t2">${UI.syncPaused && s.mode !== "off" ? t("sy_pause") : (s.at ? t("sy_last", {d:SC.dt(s.at)}) : t("sy_never"))}</div>${seg}</div>
  <button class="row" data-act="synow" ${busy ? "disabled" : ""}><span class="ico">${ic("down", 20)}</span><div class="grow"><div class="t1">${busy ? t("sy_busy") : t("sy_now")}</div></div></button>
  ${localStorage.getItem("sc2.premerge." + SC.wsKey()) ? `<button class="row" data-act="syundo"><span class="ico">${ic("minus" in H.P ? "minus" : "x", 20)}</span><div class="grow"><div class="t1">${t("sy_undo")}</div></div></button>` : ""}</div>`;
  const i = h.lastIndexOf('<div class="spacer">'); return i >= 0 ? h.slice(0, i) + card + h.slice(i) : h + card };
document.addEventListener("click", async e => { const b = e.target.closest("[data-act]"); if(!b) return; const a = b.dataset.act;
  if(a === "symode"){ e.stopImmediatePropagation(); const s = st(); s.mode = b.dataset.v; if(s.mode !== "off"){ SC.S.driveAuto = false; s.dirty = true } SC.save(); SC.render(true); if(s.mode !== "off") tick() }
  else if(a === "synow"){ e.stopImmediatePropagation(); const r = await SC.syncNow(false); if(r) H.toast(r.startsWith("g_err") ? t("g_err", {m:r.slice(6)}) : t(r), r.startsWith("g_err")) }
  else if(a === "syundo"){ e.stopImmediatePropagation(); if(SC.syncUndo()){ H.toast(t("sy_undone")); SC.render(true) } } }, true);
})();
