/* Smart Cash v1.2 — sign-in protections: progressive throttling (no user enumeration), TOTP two-step verification with one-time recovery codes,
   absolute session lifetime, Google sign-in replay protection hooks (see google.js: nonce, issuer, allow-list). All client-side: they raise the bar, a server is still needed for real enforcement (docs/SECURITY.md). */
(function(){
const SC = window.SC, H = SC.h, V = SC.VIEWS, UI = SC.UI, t = SC.t, esc = SC.esc, ic = H.ic;
Object.assign(SCI18N.en,{err_wait:"Too many attempts. Try again in a little while.",need_2fa:"Enter the 6-digit code from your authenticator app.",err_totp:"Wrong code",tf_row:"Two-step verification",tf_on:"On",tf_off:"Off",tf_hint:"Authenticator app (Google Authenticator, Microsoft Authenticator, Authy…)",tf_title:"Two-step verification",tf_setup:"Add this key to your authenticator app, then enter the 6-digit code it shows.",tf_key:"Setup key",tf_uri:"Copy setup link",tf_code:"6-digit code",tf_enable:"Turn on",tf_disable:"Turn off",tf_rec:"Recovery codes — each works once. Save them somewhere safe; they are shown only now.",tf_use_rec:"Use a recovery code instead",tf_verify:"Verify",au_2fa_on:"Two-step verification enabled",au_2fa_off:"Two-step verification disabled",au_2fa_rec:"Recovery code used",au_session_max:"Session expired (time limit)",err_domain:"This Google account is not allowed for this workspace",copied:"Copied"});
Object.assign(SCI18N.ar,{err_wait:"محاولات كثيرة. حاول مرة أخرى بعد قليل.",need_2fa:"أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة.",err_totp:"رمز غير صحيح",tf_row:"التحقق بخطوتين",tf_on:"مفعّل",tf_off:"غير مفعّل",tf_hint:"تطبيق مصادقة (Google Authenticator أو Microsoft Authenticator أو Authy…)",tf_title:"التحقق بخطوتين",tf_setup:"أضف هذا المفتاح إلى تطبيق المصادقة ثم أدخل الرمز المكوّن من 6 أرقام الذي يعرضه.",tf_key:"مفتاح الإعداد",tf_uri:"نسخ رابط الإعداد",tf_code:"رمز من 6 أرقام",tf_enable:"تفعيل",tf_disable:"إيقاف",tf_rec:"رموز الاسترداد — كل رمز يعمل مرة واحدة. احفظها في مكان آمن؛ تظهر الآن فقط.",tf_use_rec:"استخدم رمز استرداد بدلًا من ذلك",tf_verify:"تحقق",au_2fa_on:"تفعيل التحقق بخطوتين",au_2fa_off:"إيقاف التحقق بخطوتين",au_2fa_rec:"استخدام رمز استرداد",au_session_max:"انتهت الجلسة (حد زمني)",err_domain:"حساب Google هذا غير مسموح لمساحة العمل",copied:"تم النسخ"});
/* ---------- TOTP (RFC 6238, SHA-1, 30 s, 6 digits) ---------- */
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const b32enc = u8 => { let bits = "", out = ""; u8.forEach(b => bits += b.toString(2).padStart(8, "0")); for(let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)]; return out };
const b32dec = s => { let bits = ""; for(const c of s.replace(/[\s=]/g, "").toUpperCase()){ const v = B32.indexOf(c); if(v < 0) return null; bits += v.toString(2).padStart(5, "0") } const o = []; for(let i = 0; i + 8 <= bits.length; i += 8) o.push(parseInt(bits.slice(i, i + 8), 2)); return new Uint8Array(o) };
const hotp = async (key, counter) => { const k = await crypto.subtle.importKey("raw", key, {name:"HMAC", hash:"SHA-1"}, false, ["sign"]), msg = new Uint8Array(8); let c = counter; for(let i = 7; i >= 0; i--){ msg[i] = c & 255; c = Math.floor(c / 256) }
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", k, msg)), o = h[19] & 15, n = ((h[o] & 127) << 24) | (h[o+1] << 16) | (h[o+2] << 8) | h[o+3]; return String(n % 1e6).padStart(6, "0") };
SC.totpNew = () => b32enc(crypto.getRandomValues(new Uint8Array(20)));
SC.totpCheck = async (secret, code, last) => { const key = b32dec(secret || ""), c = String(code || "").replace(/\s/g, ""); if(!key || !/^\d{6}$/.test(c)) return false; const step = Math.floor(Date.now() / 30000);
  for(const d of [0, -1, 1]){ if(step + d <= (last || 0)) continue; if(await hotp(key, step + d) === c) return step + d } return false };
const sha = async s => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map(x => x.toString(16).padStart(2, "0")).join("");
const recCodes = () => Array.from({length:8}, () => { const a = crypto.getRandomValues(new Uint8Array(5)); return [...a].map(x => B32[x % 32]).join("").replace(/(.{5})(.{5})/, "$1-$2") });
/* ---------- throttling: per identifier, exponential back-off, identical answer for unknown accounts ---------- */
const G = () => (SC.S.guard ||= {att:{}}), norm = s => String(s || "").trim().toLowerCase().slice(0, 120);
const basePw = SC.passwordLogin;
SC.passwordLogin = async (ident, pass) => { const k = norm(ident), g = G().att[k] || (G().att[k] = {n:0, until:0});
  if(g.until > Date.now()) return "err_wait";
  const t0 = performance.now(), r = await basePw(ident, pass);
  if(r === "err_login"){ g.n++; if(g.n >= 3) g.until = Date.now() + Math.min(15*60e3, 2000 * 2 ** (g.n - 3)); const left = 450 - (performance.now() - t0); if(left > 0) await new Promise(res => setTimeout(res, left)); SC.save(); return r }
  if(r === "err_locked" || r === "err_wait") return r;
  g.n = 0; g.until = 0;
  const u = SC.me(); if((r === null || r === "must_change") && u && u.totp){ SC.S.session = null; UI.tf = {id:u.id, mc:r === "must_change", ex:0}; UI.sheet = {type:"tfcode", f:{}}; SC.save(); return "need_2fa" }
  return r };
const tfDone = async (u, via) => { SC.login(u.id, via); SC.save(); UI.sheet = null; UI.loginErr = null; UI.stack = []; UI.screen = UI.tf.mc ? "changepw" : "home"; UI.tf = null; SC.render() };
/* ---------- absolute session lifetime: 12 h ---------- */
setInterval(() => { const s = SC.S && SC.S.session; if(s && Date.now() - new Date(s.t).getTime() > 12*3600e3){ SC.audit("au_session_max"); SC.S.session = null; SC.save(); UI.stack = []; UI.sheet = null; UI.screen = "login"; SC.render() } }, 60000);
/* ---------- UI ---------- */
const baseMe = V.me; V.me = () => { let h = baseMe(), u = SC.me(); if(!u) return h; const on = !!u.totp;
  const row = `<div class="glass list wpad"><button class="row" data-act="sheet" data-v="tfmanage"><span class="ico">${ic("shield",20)}</span><div class="grow"><div class="t1">${t("tf_row")}</div><div class="t2">${t("tf_hint")}</div></div><span class="pill ${on ? "p-approved" : "p-review"}">${on ? t("tf_on") : t("tf_off")}</span></button></div>`;
  const i = h.lastIndexOf('<div class="spacer">'); return i >= 0 ? h.slice(0, i) + row + h.slice(i) : h + row };
const prev = SC.sheet2;
SC.sheet2 = (s, wrap, err) => { const e = s.err ? `<p class="err">${t(s.err)}</p>` : "";
  if(s.type === "tfcode") return wrap(`<p class="sub">${t("need_2fa")}</p>${H.fld("tfc", s.rec ? t("tf_use_rec") : t("tf_code"), 'inputmode="' + (s.rec ? "text" : "numeric") + '" autocomplete="one-time-code" maxlength="12"')}${e}<button class="btn btn-primary" data-act="tfgo">${t("tf_verify")}</button><button class="link center-t" data-act="tfrec">${t("tf_use_rec")}</button>`, t("tf_title"));
  if(s.type === "tfmanage"){ const u = SC.me(), f = s.f || {};
    if(u.totp) return wrap(`<p class="sub">${t("tf_hint")}</p>${H.fld("tfc", t("tf_code"), 'inputmode="numeric" maxlength="6"')}${e}<button class="btn btn-glass" data-act="tfoff">${t("tf_disable")}</button>`, t("tf_title"));
    const sec = s.secret || (s.secret = SC.totpNew()), uri = `otpauth://totp/Smart%20Cash:${encodeURIComponent(u.email)}?secret=${sec}&issuer=Smart%20Cash&digits=6&period=30`;
    if(s.codes) return wrap(`<p class="sub">${t("tf_rec")}</p><pre dir="ltr" class="num" style="font-size:16px;line-height:1.9;margin:8px 0">${s.codes.map(esc).join("\n")}</pre><button class="btn btn-primary" data-act="close">OK</button>`, t("tf_title"));
    return wrap(`<p class="sub">${t("tf_setup")}</p><div class="glass wpad" style="padding:12px"><div class="t2">${t("tf_key")}</div><code dir="ltr" class="num" style="font-size:15px;word-break:break-all">${sec.replace(/(.{4})/g, "$1 ").trim()}</code></div><button class="link" data-act="tfuri" data-v="${esc(uri)}">${t("tf_uri")}</button>${H.fld("tfc", t("tf_code"), 'inputmode="numeric" maxlength="6"')}${e}<button class="btn btn-primary" data-act="tfon">${t("tf_enable")}</button>`, t("tf_title")) }
  return prev(s, wrap, err) };
document.addEventListener("click", async ev => { const b = ev.target.closest("[data-act]"); if(!b) return; const a = b.dataset.act, s = UI.sheet, val = () => (document.getElementById("f-tfc")?.value || "").trim();
  if(a === "tfrec"){ ev.stopImmediatePropagation(); s.rec = !s.rec; SC.render(true) }
  else if(a === "tfgo" && UI.tf){ ev.stopImmediatePropagation(); const u = SC.user(UI.tf.id); if(!u || !u.totp){ UI.sheet = null; SC.render(true); return }
    if(UI.tf.ex >= 5){ UI.sheet = null; UI.loginErr = "err_wait"; UI.tf = null; G().att[norm(u.email)] = {n:5, until:Date.now() + 5*60e3}; SC.save(); SC.render(true); return }
    const code = val();
    if(s.rec){ const h = await sha(code.toUpperCase()), i = (u.totp.rec || []).indexOf(h); if(i >= 0){ u.totp.rec.splice(i, 1); SC.audit("au_2fa_rec", u.emp); return tfDone(u, "password+recovery") } }
    else { const st = await SC.totpCheck(u.totp.secret, code, u.totp.last); if(st){ u.totp.last = st; return tfDone(u, "password+2fa") } }
    UI.tf.ex++; s.err = "err_totp"; SC.render(true) }
  else if(a === "tfon"){ ev.stopImmediatePropagation(); const u = SC.me(), st = await SC.totpCheck(s.secret, val(), 0);
    if(!st){ s.err = "err_totp"; SC.render(true); return } const codes = recCodes(); u.totp = {secret:s.secret, at:SC.now(), last:st, rec:await Promise.all(codes.map(c => sha(c)))}; SC.audit("au_2fa_on", u.emp); SC.save(); s.codes = codes; s.err = null; SC.render(true) }
  else if(a === "tfoff"){ ev.stopImmediatePropagation(); const u = SC.me(); if(await SC.totpCheck(u.totp.secret, val(), u.totp.last)){ u.totp = null; SC.audit("au_2fa_off", u.emp); SC.save(); UI.sheet = null; SC.render(true) } else { s.err = "err_totp"; SC.render(true) } }
  else if(a === "tfuri"){ ev.stopImmediatePropagation(); try{ await navigator.clipboard.writeText(b.dataset.v); H.toast(t("copied")) }catch{} } }, true);
})();
