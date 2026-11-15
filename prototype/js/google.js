/* Smart Cash v0.9 — Google: Sign in with Google, Drive backup / restore / Excel export. Needs SC_CONFIG.googleClientId (see docs/GOOGLE_SETUP.md). */
(function(){
const SC = window.SC, D = window.SCDATA, H = SC.h, V = SC.VIEWS, UI = SC.UI, t = SC.t, esc = SC.esc, ic = H.ic, CFG = window.SC_CONFIG || {}, CID = CFG.googleClientId || "";
const SCOPE = "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file";
Object.assign(SCI18N.en,{g_title:"Google",g_not_set:"Google is not configured yet",g_set_hint:"The app owner must add a Google Client ID (5 minutes). Tap to see the steps.",g_signin:"Continue with Google",g_linked:"Linked: {e}",g_link:"Link my Google account",g_linked_ok:"Google account linked",g_drive:"Google Drive",g_bk:"Back up to Drive now",g_bk_hint:"Saves your data in a private app folder in your Drive",g_rs:"Restore from Drive",g_rs_hint:"Replaces this device's data with the last Drive backup",g_xl:"Export Excel to Drive",g_xl_hint:"Saves a spreadsheet of your records in your Drive",g_auto:"Auto backup",g_auto_hint:"Backs up after changes while you are connected",g_last:"Last backup: {d}",g_never:"No backup yet",g_ok_bk:"Backed up to Drive",g_ok_rs:"Restored from Drive",g_ok_xl:"Excel saved to Drive",g_err:"Google error: {m}",g_none:"No backup found in your Drive",g_cancel:"Cancelled",g_org_title:"Finish your workspace",g_bad_token:"Could not verify the Google account",g_steps_title:"Set up Google (one time)",g_steps:"1. Open console.cloud.google.com and create a project.\n2. APIs & Services: enable Google Drive API.\n3. OAuth consent screen: External, add your friends' Gmail addresses as Test users.\n4. Credentials: Create OAuth client ID (Web). Add your site address under Authorized JavaScript origins.\n5. Copy the Client ID into js/config.js (googleClientId) and redeploy.\nFull guide: docs/GOOGLE_SETUP.md",g_pending:"Your request was sent to the workspace admin",g_confirm_rs:"Replace local data with the Drive backup?",
 gd_title:"How to use",gd_row:"How to use Smart Cash",gd_row_hint:"Short guide for your plan"});
Object.assign(SCI18N.ar,{g_title:"Google",g_not_set:"Google غير مُهيأ بعد",g_set_hint:"يجب على مالك التطبيق إضافة Google Client ID (5 دقائق). اضغط لعرض الخطوات.",g_signin:"المتابعة بحساب Google",g_linked:"مربوط: {e}",g_link:"ربط حساب Google الخاص بي",g_linked_ok:"تم ربط حساب Google",g_drive:"Google Drive",g_bk:"نسخ احتياطي إلى Drive الآن",g_bk_hint:"يحفظ بياناتك في مجلد خاص بالتطبيق داخل Drive",g_rs:"استعادة من Drive",g_rs_hint:"يستبدل بيانات هذا الجهاز بآخر نسخة في Drive",g_xl:"تصدير Excel إلى Drive",g_xl_hint:"يحفظ جدول سجلاتك في Drive",g_auto:"نسخ احتياطي تلقائي",g_auto_hint:"ينسخ بعد التغييرات ما دمت متصلًا",g_last:"آخر نسخة: {d}",g_never:"لا توجد نسخة بعد",g_ok_bk:"تم النسخ إلى Drive",g_ok_rs:"تمت الاستعادة من Drive",g_ok_xl:"تم حفظ Excel في Drive",g_err:"خطأ Google: {m}",g_none:"لا توجد نسخة احتياطية في Drive",g_cancel:"أُلغي",g_org_title:"أكمل إنشاء مساحة العمل",g_bad_token:"تعذّر التحقق من حساب Google",g_steps_title:"إعداد Google (مرة واحدة)",g_steps:"1. افتح console.cloud.google.com وأنشئ مشروعًا.\n2. APIs & Services: فعّل Google Drive API.\n3. OAuth consent screen: اختر External وأضف بريد أصدقائك في Test users.\n4. Credentials: أنشئ OAuth client ID (Web) وأضف عنوان موقعك في Authorized JavaScript origins.\n5. انسخ الـ Client ID إلى js/config.js (googleClientId) وأعد النشر.\nالدليل الكامل: docs/GOOGLE_SETUP.md",g_pending:"أُرسل طلبك إلى مدير مساحة العمل",g_confirm_rs:"استبدال البيانات المحلية بنسخة Drive؟",
 gd_title:"طريقة الاستخدام",gd_row:"طريقة استخدام سمارت كاش",gd_row_hint:"دليل مختصر لخطتك"});

/* ---------- Google Identity Services ---------- */
let gisP = null;
const gis = () => gisP || (gisP = new Promise((res, rej) => { if(window.google && google.accounts) return res(); const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.onload = () => res(); s.onerror = () => { gisP = null; rej(new Error("offline")) }; document.head.appendChild(s) }));
const jwt = tok => { try{ const b = tok.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"); return JSON.parse(decodeURIComponent(escape(atob(b + "=".repeat((4-b.length%4)%4))))) }catch{ return null } };
const rnd = () => { const a = new Uint8Array(16); crypto.getRandomValues(a); return [...a].map(x=>x.toString(36)).join("").slice(0,18) + "aA1" };
SC.gConfigured = () => !!CID;

async function onCredential(resp){
  const p = jwt(resp && resp.credential);
  if(!p || p.aud !== CID || !p.email || p.email_verified === false || p.exp*1000 < Date.now()){ UI.sheet = null; H.toast(t("g_bad_token"), true); SC.render(true); return }
  const email = String(p.email).toLowerCase(), S = SC.S, me = SC.me();
  if(UI.gMode === "link" && me){ me.google = email; SC.audit("au_google_link", email); SC.save(); UI.sheet = null; H.toast(t("g_linked_ok")); SC.render(true); return }
  let u = S.users.find(x => x.google && x.google.toLowerCase() === email) || S.users.find(x => x.status === "active" && x.email.toLowerCase() === email);
  if(u){ if(!u.google) u.google = email; const err = SC.googleLogin(email); UI.sheet = null; if(err){ H.toast(t(err), true); SC.render(true); return } UI.stack = []; UI.screen = "home"; SC.render(); return }
  if(S.needsSetup || !S.users.length){
    if(S.plan === "personal"){ await finishSetup({name:p.name || email.split("@")[0], email, org:""}); return }
    UI.sheet = {type:"gorg", f:{name:p.name || "", email}}; SC.render(true); return }
  const r = SC.requestAccount({name:p.name || email.split("@")[0], email}); const pend = S.users.find(x => x.email.toLowerCase() === email); if(pend && !r){ pend.google = email; SC.save() }
  UI.sheet = null; H.toast(r ? t(r) : t("g_pending"), !!r); SC.render(true);
}
async function finishSetup(d){ const pw = rnd(), r = await SC.setupWorkspace({org:d.org, name:d.name, email:d.email, pw, pw2:pw}); if(r){ UI.sheet.err = r; SC.render(true); return }
  SC.me().google = d.email; SC.save(); UI.sheet = null; UI.stack = []; UI.screen = "home"; H.toast(t("su_done")); SC.render() }
async function renderBtn(){ const el = document.getElementById("g-btn"); if(!el || el.dataset.done) return; el.dataset.done = 1;
  try{ await gis(); google.accounts.id.initialize({client_id:CID, callback:onCredential, ux_mode:"popup"}); google.accounts.id.renderButton(el, {theme:"outline", size:"large", text:"continue_with", shape:"pill", width:280, locale:SC.ui.lang}) }catch(e){ el.textContent = t("g_err",{m:e.message}) } }

/* ---------- Drive ---------- */
let tok = null, exp = 0, client = null;
const token = () => new Promise(async (res, rej) => { if(tok && Date.now() < exp - 60000) return res(tok);
  try{ await gis(); client = client || google.accounts.oauth2.initTokenClient({client_id:CID, scope:SCOPE, callback:r => { if(r.error) rej(new Error(r.error)); else { tok = r.access_token; exp = Date.now() + (+r.expires_in||3600)*1000; res(tok) } }, error_callback:e => rej(new Error(e && e.type || "popup_closed"))}); client.requestAccessToken({prompt:tok ? "" : "consent"}) }catch(e){ rej(e) } });
const api = async (url, o={}) => { const k = await token(), r = await fetch(url, {...o, headers:{...(o.headers||{}), Authorization:"Bearer "+k}}); if(!r.ok){ const x = await r.text().catch(()=>""); throw new Error(r.status+" "+x.slice(0,120)) } return r };
const multipart = (meta, blob) => { const b = "scb" + Date.now(), mime = blob.type || "application/octet-stream";
  return {body:new Blob([`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: ${mime}\r\n\r\n`, blob, `\r\n--${b}--`]), type:`multipart/related; boundary=${b}`} };
const upload = async (meta, blob, id) => { const m = multipart(meta, blob), url = "https://www.googleapis.com/upload/drive/v3/files" + (id ? "/"+id : "") + "?uploadType=multipart&fields=id,modifiedTime";
  return (await api(url, {method:id?"PATCH":"POST", headers:{"Content-Type":m.type}, body:m.body})).json() };
const bkName = () => `smartcash-${SC.ws}.json`;
const findBk = async () => { const q = encodeURIComponent(`name='${bkName()}' and trashed=false`); return (await (await api(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)&orderBy=modifiedTime desc&pageSize=1`)).json()).files[0] || null };
SC.driveBackup = async () => { const S = SC.S, blob = new Blob([JSON.stringify({app:"smart-cash", v:S.v, at:SC.now(), ws:SC.ws, state:{...S, session:null}})], {type:"application/json"}), f = await findBk();
  const r = await upload(f ? {} : {name:bkName(), parents:["appDataFolder"]}, blob, f && f.id); S.drive = {...(S.drive||{}), at:SC.now(), id:r.id}; SC.save(); return r };
SC.driveRestore = async () => { const f = await findBk(); if(!f) return "g_none"; const data = await (await api(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`)).json();
  if(!data || data.app !== "smart-cash" || !data.state || data.state.v !== D.VERSION) return "err_restore_file";
  const sess = SC.S.session; SC.S = data.state; SC.S.session = sess; SC.reindex(); SC.audit("au_restore", "drive"); SC.save(); return null };
SC.driveExcel = async () => { const orig = SC.saveFile; let got = null; SC.saveFile = async (n, b) => { got = [n, b]; return null };
  try{ const e = await SC.exportAll(); if(e || !got) return e || "err_download_unavailable" } finally { SC.saveFile = orig }
  const blob = got[1] instanceof Blob ? got[1] : new Blob([got[1]]); await upload({name:got[0]}, blob); return null };
let tmr = null; const baseSave = SC.save;
SC.save = () => { baseSave(); if(SC.S && SC.S.driveAuto && tok && Date.now() < exp - 60000){ clearTimeout(tmr); tmr = setTimeout(() => { SC.driveBackup().catch(()=>{}) }, 20000) } };
const run = async (fn, okKey) => { UI.busy = "g"; SC.render(true); try{ const e = await fn(); H.toast(e ? t(e) : t(okKey), !!e) }catch(e){ H.toast(t("g_err",{m:String(e.message||e).slice(0,90)}), true) } UI.busy = null; SC.render(true) };


/* ---------- usage guide (replaces sample data) ---------- */
Object.assign(SCI18N.en,{gd_h1:"Start in 4 steps",gd_1:"Add a custodian (custody) or a customer from Home.",gd_2:"Photograph each invoice: the app reads it and files it in a folder of 30.",gd_3:"Approve or reject, then track balances and reminders.",gd_4:"Back up to Google Drive from Account, and export Excel any time.",gd_note:"Your data stays on this device until you back it up. Nothing here is sample data."});
Object.assign(SCI18N.ar,{gd_h1:"ابدأ في 4 خطوات",gd_1:"أضف عهدة أو عميلًا من الرئيسية.",gd_2:"صوّر كل فاتورة: يقرؤها التطبيق ويحفظها في مجلد من 30 فاتورة.",gd_3:"اعتمد أو ارفض، ثم تابع الأرصدة والتذكيرات.",gd_4:"انسخ احتياطيًا إلى Google Drive من حسابي، وصدّر Excel متى شئت.",gd_note:"بياناتك تبقى على هذا الجهاز حتى تنسخها احتياطيًا. لا توجد بيانات تجريبية هنا."});
V.guide = () => `<div class="page">${H.nav(t("gd_title"))}<div class="glass list wpad"><div class="row"><div class="grow"><div class="t1">${t("gd_h1")}</div></div></div>${[1,2,3,4].map(n=>`<div class="row"><span class="avatar sm">${n}</span><div class="grow"><div class="t2">${t("gd_"+n)}</div></div></div>`).join("")}</div><p class="t2" style="padding:0 16px">${t("gd_note")}</p></div>`;

/* ---------- UI ---------- */
const baseMe = V.me;
V.me = () => { let h = baseMe(); const me = SC.me(); if(!me) return h; const S = SC.S, last = S.drive && S.drive.at, busy = UI.busy === "g";
  const blk = !CID
   ? `<div class="glass list wpad"><button class="row" data-act="sheet" data-v="ghelp"><span class="ico">${ic("g",20)}</span><div class="grow"><div class="t1">${t("g_not_set")}</div><div class="t2">${t("g_set_hint")}</div></div></button>
      <button class="row" data-act="go" data-v="guide"><span class="ico">${ic("info",20)}</span><div class="grow"><div class="t1">${t("gd_row")}</div><div class="t2">${t("gd_row_hint")}</div></div></button></div>`
   : `<div class="glass list wpad"><button class="row" data-act="glink"><span class="ico">${ic("g",20)}</span><div class="grow"><div class="t1">${me.google ? t("g_linked",{e:esc(me.google)}) : t("g_link")}</div></div></button>
      <button class="row" data-act="gbk" ${busy?"disabled":""}><span class="ico">${ic("up",20)}</span><div class="grow"><div class="t1">${t("g_bk")}</div><div class="t2">${last ? t("g_last",{d:SC.dt(last)}) : t("g_never")}</div></div></button>
      <button class="row" data-act="grs" ${busy?"disabled":""}><span class="ico">${ic("down",20)}</span><div class="grow"><div class="t1">${t("g_rs")}</div><div class="t2">${t("g_rs_hint")}</div></div></button>
      <button class="row" data-act="gxl" ${busy?"disabled":""}><span class="ico">${ic("sheet",20)}</span><div class="grow"><div class="t1">${t("g_xl")}</div><div class="t2">${t("g_xl_hint")}</div></div></button>
      <button class="row" data-act="gauto"><span class="ico">${ic("history",20)}</span><div class="grow"><div class="t1">${t("g_auto")}</div><div class="t2">${t("g_auto_hint")}</div></div><span class="switch ${S.driveAuto?"on":""}"></span></button>
      <button class="row" data-act="go" data-v="guide"><span class="ico">${ic("info",20)}</span><div class="grow"><div class="t1">${t("gd_row")}</div><div class="t2">${t("gd_row_hint")}</div></div></button></div>`;
  const i = h.lastIndexOf('<div class="spacer">'); return i>=0 ? h.slice(0,i)+blk+h.slice(i) : h+blk };
const prev = SC.sheet2;
SC.sheet2 = (s, wrap, err) => {
  if(s.type==="ghelp") return wrap(`<p class="sub" style="white-space:pre-line">${esc(t("g_steps"))}</p>`, t("g_steps_title"));
  if(s.type==="gsign") return wrap(`<div style="display:grid;place-items:center;min-height:56px"><div id="g-btn"></div></div>${err}`, t("g_signin"));
  if(s.type==="gorg"){ const f = s.f || {}; return wrap(`${H.fld("org", t("su_org"))}<p class="t2">${esc(f.name||"")} · ${esc(f.email||"")}</p>${err}<button class="btn btn-primary" data-act="gorgok">${t("su_create")}</button>`, t("g_org_title")) }
  return prev(s, wrap, err) };
const baseAfter = SC.afterRender; SC.afterRender = function(){ if(baseAfter) baseAfter.apply(this, arguments); if(UI.sheet && UI.sheet.type==="gsign") renderBtn() };
document.addEventListener("click", e => { const b = e.target.closest("[data-act]"); if(!b) return; const a = b.dataset.act;
  if(a==="google" && (CID || window.SC_PROD)){ e.stopImmediatePropagation(); e.preventDefault(); if(!CID){ UI.sheet = {type:"ghelp"} } else { UI.gMode = "login"; UI.sheet = {type:"gsign"} } SC.render(true); return }
  if(a==="glink"){ UI.gMode = "link"; UI.sheet = {type:"gsign"}; SC.render(true) }
  else if(a==="gbk") run(async () => { await SC.driveBackup() }, "g_ok_bk");
  else if(a==="grs"){ if(!window.confirm(t("g_confirm_rs"))) return; run(() => SC.driveRestore(), "g_ok_rs") }
  else if(a==="gxl") run(() => SC.driveExcel(), "g_ok_xl");
  else if(a==="gauto"){ SC.S.driveAuto = !SC.S.driveAuto; SC.save(); if(SC.S.driveAuto) token().catch(()=>{}); SC.render(true) }
  else if(a==="gorgok"){ const F = UI.sheet.f || {}; if(!(F.org||"").trim()){ UI.sheet.err = "su_err_org"; SC.render(true); return } finishSetup({org:F.org, name:F.name || F.email, email:F.email}) } }, true);
})();
