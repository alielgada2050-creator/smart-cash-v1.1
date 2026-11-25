/* Smart Cash v1.2 — isolated sample account: one tap on the login screen opens a sandbox workspace with sample data and a guided tour.
   It never touches the real workspace (separate storage key). Drive/Google sync is switched off inside it. */
(function(){
const SC = window.SC, H = SC.h, V = SC.VIEWS, UI = SC.UI, t = SC.t, esc = SC.esc, ic = H.ic;
Object.assign(SCI18N.en,{dm_btn:"Try a sample account",dm_hint:"Explore with sample data — your real data is never touched",dm_pick:"Choose what to explore",dm_p:"Individuals — personal cash book",dm_b:"Small establishment — custody & approvals",dm_e:"Company — branches, roles & audit",dm_bar:"SAMPLE ACCOUNT · fake data",dm_exit:"Exit",dm_next:"Next",dm_back:"Back",dm_open:"Show me",dm_done:"Create my workspace",
 dm_s1t:"Welcome",dm_s1:"This is a sandbox with sample data. Nothing you do here affects your real data. Take the 1-minute tour.",
 dm_s2t:"1 · Capture an invoice",dm_s2:"Photograph or enter an invoice. The app reads supplier, VAT and total and files it in a folder of 30 invoices.",
 dm_s3t:"2 · Custody & approvals",dm_s3:"A custody is handed to an employee, who spends it against invoices. Each invoice routes to the right approver by limits and roles.",
 dm_s3pt:"2 · Your cash book",dm_s3p:"Record income and expenses, see your balance and monthly totals, and share any entry on WhatsApp.",
 dm_s4t:"3 · Audit & insights",dm_s4:"Every action is sealed in a tamper-evident log. The audit page flags duplicates and wrong VAT, and exports to Excel.",
 dm_s5t:"4 · Sync & team",dm_s5:"Back up and sync across your phone and computer with Google Drive, and give each person only the access they need.",
 dm_s6t:"Ready?",dm_s6:"Exit the sample and create your own workspace in a minute."});
Object.assign(SCI18N.ar,{dm_btn:"جرّب حسابًا تجريبيًا",dm_hint:"استكشف ببيانات وهمية — بياناتك الحقيقية لا تُمسّ",dm_pick:"اختر ما تريد استكشافه",dm_p:"الأفراد — دفتر الحساب الشخصي",dm_b:"منشأة صغيرة — العهد والاعتمادات",dm_e:"شركة — فروع وصلاحيات وتدقيق",dm_bar:"حساب تجريبي · بيانات وهمية",dm_exit:"خروج",dm_next:"التالي",dm_back:"السابق",dm_open:"أرني",dm_done:"أنشئ مساحة عملي",
 dm_s1t:"أهلًا بك",dm_s1:"هذه بيئة تجريبية ببيانات وهمية. لا شيء تفعله هنا يؤثر على بياناتك الحقيقية. خذ جولة من دقيقة.",
 dm_s2t:"1 · تصوير فاتورة",dm_s2:"صوّر الفاتورة أو أدخلها؛ يقرأ التطبيق المورد والضريبة والإجمالي ويحفظها في مجلد من 30 فاتورة.",
 dm_s3t:"2 · العهد والاعتمادات",dm_s3:"تُسلَّم العهدة لموظف يصرف منها بفواتير، وتصل كل فاتورة للمعتمد المناسب حسب الحدود والأدوار.",
 dm_s3pt:"2 · دفتر حسابك",dm_s3p:"سجّل الدخل والمصروف، وشاهد رصيدك وإجماليات الشهر، وشارك أي قيد على واتساب.",
 dm_s4t:"3 · التدقيق والتحليل",dm_s4:"كل إجراء مختوم في سجل يكشف العبث. صفحة التدقيق تنبّه للتكرار والضريبة الخاطئة، وتصدّر إلى Excel.",
 dm_s5t:"4 · المزامنة والفريق",dm_s5:"انسخ احتياطيًا وزامن بين جوالك وحاسوبك عبر Google Drive، وامنح كل شخص الصلاحية التي يحتاجها فقط.",
 dm_s6t:"جاهز؟",dm_s6:"اخرج من التجربة وأنشئ مساحة عملك الخاصة في دقيقة."});
const PROD = !!window.SC_PROD;
const click = (act, v) => { const b = document.createElement("button"); b.dataset.act = act; if(v) b.dataset.v = v; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove() };
const steps = () => { const p = SC.S.plan; return [
  {k:"dm_s1"}, {k:"dm_s2", tab:"invoices"}, p === "personal" ? {k:"dm_s3p", tt:"dm_s3pt", go:"cash"} : {k:"dm_s3", tab:"advances"},
  {k:"dm_s4", go:"insights"}, {k:"dm_s5", tab:"me"}, {k:"dm_s6", end:true}] };
/* login entry */
const baseLogin = V.login;
V.login = () => { let h = baseLogin(); if(SC.demo) return h; const btn = `<button class="btn btn-glass" data-act="trydemo" style="margin:6px 18px 0;width:calc(100% - 36px)"><span>${t("dm_btn")}</span></button><p class="t2 center-t" style="margin:6px 18px 18px">${t("dm_hint")}</p>`;
  const m = /<button[^>]*data-act="go"[\s\S]*?<\/button>/.exec(h); return m ? h.replace(m[0], m[0] + btn) : h + btn };
const prev = SC.sheet2;
SC.sheet2 = (s, wrap, err) => { if(s.type !== "demopick") return prev(s, wrap, err);
  return wrap(`<div class="glass list">${[["personal","dm_p","wallet"],["business","dm_b","shop"],["enterprise","dm_e","building"]].map(([k, l, i]) => `<button class="row" data-act="demogo" data-v="${k}"><span class="ico">${ic(i in H.P ? i : "user", 20)}</span><div class="grow"><div class="t1">${t(l)}</div></div></button>`).join("")}</div>`, t("dm_pick")) };
/* tour card + top bar (outside the view so it survives navigation) */
function paint(){ document.getElementById("demo-ui")?.remove(); const ph = document.getElementById("phone"); document.documentElement.classList.toggle("is-demo", !!SC.demo); if(!SC.demo || !ph || !SC.me()) return;
  const S = steps(), T = UI.tour == null ? -1 : UI.tour, st = S[T], box = document.createElement("div"); box.id = "demo-ui";
  box.innerHTML = `<div class="dm-bar"><span>${t("dm_bar")}</span><button data-act="demoexit">${t("dm_exit")}</button></div>` +
    (st ? `<div class="dm-card"><div class="t1">${t(st.tt || st.k + "t")}</div><div class="t2">${t(st.k)}</div><div class="dm-acts">${T > 0 ? `<button class="chip" data-act="demoback">${t("dm_back")}</button>` : ""}${st.tab || st.go ? `<button class="chip" data-act="demoshow">${t("dm_open")}</button>` : ""}<button class="btn btn-primary dm-next" data-act="${st.end ? "demofinish" : "demonext"}">${st.end ? t("dm_done") : t("dm_next")}</button></div><div class="dm-dots">${S.map((_, i) => `<i class="${i === T ? "on" : ""}"></i>`).join("")}</div></div>` : "");
  ph.appendChild(box) }
const base = SC.afterRender; SC.afterRender = function(){ if(base) base.apply(this, arguments); paint() };
document.addEventListener("click", e => { const b = e.target.closest("[data-act]"); if(!b) return; const a = b.dataset.act, S = steps();
  if(a === "trydemo"){ e.stopImmediatePropagation(); UI.sheet = {type:"demopick"}; SC.render(true) }
  else if(a === "demogo"){ e.stopImmediatePropagation(); SC.enterDemo(b.dataset.v); const U = SC.S.users, u = U.find(x => x.role === "personal") || U.find(x => x.role === "owner") || U.find(x => x.role === "admin") || U[0];
    SC.login(u.id, "demo"); UI.sheet = null; UI.stack = []; UI.screen = "home"; UI.tour = 0; SC.render() }
  else if(a === "demonext"){ e.stopImmediatePropagation(); UI.tour = Math.min(S.length - 1, UI.tour + 1); SC.render(true) }
  else if(a === "demoback"){ e.stopImmediatePropagation(); UI.tour = Math.max(0, UI.tour - 1); SC.render(true) }
  else if(a === "demoshow"){ e.stopImmediatePropagation(); const st = S[UI.tour]; if(st.tab) click("tab", st.tab); else if(st.go) click("go", st.go) }
  else if(a === "demofinish" || a === "demoexit"){ e.stopImmediatePropagation(); SC.S.session = null; SC.exitDemo(); UI.tour = null; UI.sheet = null; UI.stack = []; UI.screen = "login"; SC.render(); if(a === "demofinish") setTimeout(() => click("startlive") , 0) } }, true);
if(UI.screen === "login") setTimeout(() => SC.render(true), 0);
})();
