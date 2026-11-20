# ربط الذكاء الاصطناعي (OpenRouter) بأمان

**القاعدة:** مفتاح OpenRouter لا يوضع في التطبيق ولا في GitHub ولا في المحادثة. أي مفتاح داخل صفحة ويب يمكن لأي زائر سرقته. لذلك نستخدم وسيطًا صغيرًا (`server/worker.js`) يحمل المفتاح كسر مشفّر.

## الخطوات (10 دقائق)
1. أنشئ مفتاحًا من openrouter.ai/keys (حدّد له سقف إنفاق شهري).
2. سجّل في cloudflare.com (مجاني) وثبّت الأداة: `npm i -g wrangler` ثم `wrangler login`.
3. في مجلد `server/`: عدّل `ORIGINS` في `wrangler.toml` إلى رابط تطبيقك بالضبط.
4. `npx wrangler secret put OPENROUTER_API_KEY` ← الصق المفتاح في الطرفية فقط (لا هنا).
5. `npx wrangler deploy` ← يعطيك رابطًا مثل `https://smartcash-ai.xxx.workers.dev`.
6. ضع الرابط في GitHub: Settings → Variables → `AI_ENDPOINT` (أو في `js/config.js` ← `aiEndpoint`) وأعد النشر.

## ما يُرسل وما لا يُرسل
يرسل التطبيق **إجماليات مجهولة فقط** (حسب التصنيف/الشهر/الفرع، موردون مرقّمون S1..S8، عدد الملاحظات). لا أسماء ولا جوالات ولا صور فواتير ولا كلمات مرور.
الوسيط يرفض أي أصل غير مذكور في `ORIGINS`، ويحدّ الحجم (60KB) والمعدل (6 طلبات/دقيقة/IP).

## نماذج مجانية
غيّر `MODEL` في `wrangler.toml` لأي نموذج مجاني من openrouter.ai/models (الحدود والسياسات تتغير؛ راجعها قبل الاعتماد).
