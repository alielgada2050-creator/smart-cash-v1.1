# ربط سمارت كاش بخدمات Google (مرة واحدة، ~10 دقائق)

ما يعمله الربط الآن (v0.9):
- **تسجيل الدخول بحساب Google** (Google Identity Services) للمستخدمين الجدد: أول مستخدم ينشئ مساحة العمل، وبقية الأصدقاء يرسلون طلب انضمام يوافق عليه المدير.
- **Google Sheets**: تصدير جدول حي إلى Drive. **Google Calendar**: إضافة تذكير تحصيل العميل كحدث.
- **Google Drive**: نسخة احتياطية واستعادة (مجلد خاص بالتطبيق `appDataFolder`)، ونسخ احتياطي تلقائي، وتصدير Excel إلى Drive.
- لا يوجد مفتاح سري في الكود. الـ **Client ID** عام بطبيعته ويوضع في `js/config.js`.

## 1) إنشاء المشروع
1. افتح https://console.cloud.google.com وأنشئ مشروعًا باسم Smart Cash.
2. **APIs & Services → Library** → فعّل **Google Drive API** و**Google Calendar API** (للتذكيرات). تصدير Google Sheets يمر عبر Drive ولا يحتاج API إضافية.

## 2) شاشة الموافقة (OAuth consent screen)
1. اختر **External**، واكتب اسم التطبيق وبريدك.
2. أضف النطاقات: `.../auth/drive.appdata` و `.../auth/drive.file`.
3. اترك الحالة **Testing** وأضف بريد أصدقائك وأقاربك في **Test users** (حتى 100 شخص). الاختبار لا يحتاج مراجعة من Google.

## 3) إنشاء Client ID
1. **Credentials → Create credentials → OAuth client ID → Web application**.
2. في **Authorized JavaScript origins** أضف عنوان موقعك بالضبط، مثال: `https://USERNAME.github.io` (بدون مسار)، وللتجربة المحلية `http://localhost:8765`.
3. انسخ الـ Client ID (ينتهي بـ `.apps.googleusercontent.com`). **لا تنسخ ولا ترسل Client secret لأحد.**

## 4) وضعه في التطبيق
أحد خيارين:
- عدّل `prototype/js/config.js` وضع القيمة في `googleClientId`، ثم ارفع التغيير.
- أو في GitHub: Settings → Secrets and variables → Actions → **Variables** → أضف متغيرًا باسم `GOOGLE_CLIENT_ID` (الـ workflow يمرره لـ `app/build.py`).

بعد النشر يظهر زر «المتابعة بحساب Google» وصف Drive في «حسابي».

## حدود صريحة
- الدخول بـ Google هنا يتحقق من الرمز داخل المتصفح فقط (بدون سيرفر). للحماية الحقيقية انقل التحقق إلى سيرفر.
- Drive نسخة احتياطية **لكل مستخدم** وليست قاعدة بيانات مشتركة: لا مزامنة فورية بين الأجهزة/المستخدمين.
- لقاعدة بيانات مشتركة لعدة مستخدمين: المرحلة 2 = Firebase Auth + Firestore (أو Cloud SQL مع الـ schema الموجود في `db/`). تحتاج مشروع Firebase وقواعد أمان، وأقوم ببنائها عندما تعطيني الـ Client/Project ID (وليس أي مفتاح سري).
- في وضع Testing يظهر تحذير «تطبيق غير موثق» عند أول دخول: اختر Advanced ثم Continue. هذا طبيعي حتى تقدّم للتوثيق.

## تحويله إلى APK / تطبيق للمتاجر
- أسرع طريقة: https://www.pwabuilder.com ← الصق رابط موقعك على GitHub Pages ← Android ← نزّل الحزمة (APK/AAB). تحتاج HTTPS وملف manifest (موجود).
- iPhone: افتح الرابط في Safari ← مشاركة ← «إضافة إلى الشاشة الرئيسية».
- النشر في Play Store يتطلب حساب مطور (25$ مرة واحدة).
