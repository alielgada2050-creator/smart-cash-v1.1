#!/usr/bin/env python3
"""Builds the installable web app (PWA) into ../dist from ../prototype. Run: python3 app/build.py"""
import os, re, shutil, json, glob
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src, out = os.path.join(root,"prototype"), os.path.join(root,"dist")
shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
shutil.copytree(os.path.join(src,"js"), os.path.join(out,"js"))
if os.path.isdir(os.path.join(src,"fonts")): shutil.copytree(os.path.join(src,"fonts"), os.path.join(out,"fonts"))
for f in ("icon-192.png","icon-512.png","icon-maskable.png","apple-touch-icon.png","favicon.svg"):
    shutil.copy(os.path.join(root,"app",f), out)
cid = os.environ.get("GOOGLE_CLIENT_ID","").strip()  # public OAuth Client ID only (never a secret)
cfg = os.path.join(out,"js","config.js"); c = open(cfg,encoding="utf-8").read()
if cid: c = c.replace('googleClientId: ""','googleClientId: "%s"' % cid.replace('"',''))
open(cfg,"w",encoding="utf-8").write(c.replace("window.SC_PROD = 0;","window.SC_PROD = 1;"))
body = open(os.path.join(src,"smart-cash.html"),encoding="utf-8").read()
os.makedirs(os.path.join(out,"vendor"))
for f in os.listdir(os.path.join(root,"app","vendor")): shutil.copy(os.path.join(root,"app","vendor",f), os.path.join(out,"vendor"))
body = body.replace("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js","vendor/xlsx.min.js").replace("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js","vendor/jszip.min.js").replace("https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js","vendor/jsQR.js")
vj = os.path.join(out,"js","views.js"); v = open(vj,encoding="utf-8").read()
v = v.replace("https://cdn.jsdelivr.net/npm/@lucasmarkes/hairline@0.5.1/dist/index.js","./vendor/hairline.mjs").replace("https://unpkg.com/@lucasmarkes/hairline@0.5.1/dist/index.js","./vendor/hairline.mjs")
open(vj,"w",encoding="utf-8").write(v)
body = re.sub(r'<script src="vendor/[^"]+"></script>\n?',"",body)   # lazy-libs: loaded on demand by js/lazy.js
body = re.sub(r'<script charset="utf-8" src="js/i18n/(?!en\.js|ar\.js)[a-z]+\.js"></script>\n?',"",body)   # lazy-i18n
aiu = os.environ.get("AI_ENDPOINT","").strip()
if aiu:
    c2 = open(cfg,encoding="utf-8").read().replace('aiEndpoint: ""','aiEndpoint: "%s"' % aiu.replace('"',''))
    open(cfg,"w",encoding="utf-8").write(c2)
pay = os.environ.get("PAY_ENDPOINT","").strip()
if pay:
    c3 = open(cfg,encoding="utf-8").read().replace('payEndpoint: ""','payEndpoint: "%s"' % pay.rstrip("/").replace('"',''))
    open(cfg,"w",encoding="utf-8").write(c3)
def host(u): return u.split("/")[0]+"//"+u.split("/")[2] if u.startswith("http") else ""
ai_host = (host(aiu)+" "+host(pay)).strip(); 
csp = ("default-src 'self'; script-src 'self' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style; "
 "font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.googleusercontent.com; media-src 'self' blob:; "
 "connect-src 'self' https://accounts.google.com https://www.googleapis.com %s; frame-src https://accounts.google.com; object-src 'none'; base-uri 'none'; form-action 'self'; worker-src 'self'" % ai_host).strip()

body = re.sub(r"<title>.*?</title>\n","",body,count=1)
body = body.replace('<meta name="claude:viewport-fit-sides" content="cover">\n',"")
head = '''<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content">
<title>سمارت كاش · Smart Cash</title>
<meta name="theme-color" content="#000000">
<meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Smart Cash">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta http-equiv="Content-Security-Policy" content="%CSP%">
<meta name="referrer" content="no-referrer">
<style>html,body{margin:0;height:100%}</style>
'''
open(os.path.join(out,"index.html"),"w",encoding="utf-8").write(head.replace('%CSP%',csp)+body.replace("</body>","")+"\n</body></html>\n")
json.dump({"name":"سمارت كاش — Smart Cash","short_name":"Smart Cash","lang":"ar","dir":"rtl","start_url":"./index.html","scope":"./","display":"standalone","orientation":"any",
 "background_color":"#000000","theme_color":"#000000","description":"إدارة المصروفات والعهد والفواتير",
 "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png"},{"src":"icon-maskable.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]},
 open(os.path.join(out,"manifest.webmanifest"),"w",encoding="utf-8"),ensure_ascii=False,indent=1)
files = ["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","favicon.svg"]+sorted(os.path.relpath(p,out).replace(os.sep,"/") for p in [q for q in glob.glob(out+"/js/**/*.js",recursive=True) if "/i18n/" not in q or q.endswith(("/en.js","/ar.js"))]+glob.glob(out+"/vendor/hairline.mjs"))
sw = '''const V="smartcash-v1.3", CORE=%s;
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{ const r=e.request; if(r.method!=="GET") return; if(new URL(r.url).origin!==location.origin && !/^https:\\/\\/fonts\\.(googleapis|gstatic)\\.com\\//.test(r.url)) return;
  e.respondWith(caches.match(r).then(hit=>{ const net=fetch(r).then(res=>{ if(res&&(res.ok||res.type==="opaque")){ const cp=res.clone(); caches.open(V).then(c=>c.put(r,cp)) } return res }).catch(()=>hit||(r.mode==="navigate"?caches.match("index.html"):undefined)); return hit||net })) });
''' % json.dumps(files)
open(os.path.join(out,"sw.js"),"w").write(sw)
print("built", out, len(files), "core files")
