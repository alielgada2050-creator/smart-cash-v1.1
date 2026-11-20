# النشر: Android / iOS / سطح المكتب (خطوات تُنفَّذ على جهازك)

> لا أستطيع بناء APK/AAB/IPA من بيئتي (لا Android SDK ولا Xcode ولا مفاتيح توقيع). الإعدادات جاهزة وما تبقى أوامر قليلة.

## 0) قبل أي شيء
1. انشر التطبيق على HTTPS (GitHub Pages) وجرّبه. 2. ضع Client ID و AI_ENDPOINT كما في GOOGLE_SETUP.md و AI_SETUP.md. 3. غيّر `com.YOURNAME.smartcash` إلى معرّف حزمة فريد (لا يتغير بعد النشر).

## 1) Google Play (Android) — الطريق الموصى به: TWA
Google يمنع تسجيل الدخول بحساب Google داخل WebView، لذلك استخدم TWA (يعمل عبر Chrome):
1. https://www.pwabuilder.com ← رابط موقعك ← Package for stores ← **Android** ← ضع معرّف الحزمة ← نزّل الحزمة (AAB + مفتاح التوقيع: احفظه بعيدًا ولا ترفعه لـ GitHub).
2. ارفع ملف `assetlinks.json` الذي تعطيه الأداة إلى `/.well-known/` في موقعك (يزيل شريط العنوان).
3. Play Console (رسوم 25$ مرة واحدة): أنشئ تطبيقًا ← ارفع AAB على مسار **Internal testing** أولًا وأضف إيميلات أصدقائك ← أكمل **Data safety** (استخدم docs/PRIVACY.md) و Content rating ← رابط سياسة الخصوصية (انشر PRIVACY.md كصفحة).
4. للحسابات الشخصية الجديدة تشترط Google اختبارًا مغلقًا (≈12 مختبرًا لمدة 14 يومًا) قبل الإنتاج: تحقق من الشرط الحالي في Play Console.
بديل: Capacitor (`mobile/`): `npm i && npx cap add android && npm run sync && npm run android` ثم Build → Generate Signed Bundle. تنبيه: دخول Google لن يعمل داخل WebView؛ استخدم الدخول بالبريد/كلمة المرور أو إضافة Google Auth الأصلية.

## 2) iOS / App Store
يحتاج Mac + Xcode + حساب Apple Developer (99$/سنة).
`cd mobile && npm i && npx cap add ios && npm run sync && npm run ios` ← اضبط Team و Bundle ID ← Archive ← TestFlight (حتى 10,000 مختبر برابط). Apple قد ترفض تطبيقًا هو مجرد موقع؛ أضف قيمة أصلية (إشعارات، كاميرا أصلية، Face ID) قبل الإرسال للمراجعة. بدون Mac: «إضافة إلى الشاشة الرئيسية» من Safari يعمل فورًا.

## 3) الكمبيوتر
- الأسهل: افتح الرابط في Chrome/Edge ← أيقونة التثبيت (Install). يعمل Windows/Mac/Linux بلا بناء.
- مثبّت مستقل: `cd desktop && npm i && SMARTCASH_URL=https://USERNAME.github.io/smart-cash/ npm start` ثم `npm run dist` لإنتاج .exe/.dmg/.AppImage.

## 4) قبل الإطلاق للجمهور (مهم)
هذه نسخة بلا خادم: الدخول وكلمات المرور داخل المتصفح فقط. للعمل الحقيقي مع شركات: خادم + قاعدة بيانات (مخطط db/) + تحقق الرموز من الخادم. راجع docs/SECURITY.md.
