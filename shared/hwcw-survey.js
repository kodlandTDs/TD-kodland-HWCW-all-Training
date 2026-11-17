/* =====================================================================
   HW/CW TRAINING — start survey + final survey
   Loaded AFTER hwcw-core.js (it uses STORE) and AFTER the engine.

   - Start survey: blocking pop-up on open, sent once per browser,
     saved as kl-start-survey-hwcw (and kl-m0-identity, which td-time.js reads).
   - Final survey: a section inside the LAST module, above its check.
     The check stays locked until it is sent.
   - Question ids stay in English: they are the Google Sheet columns.
   - Developer mode (?dev=1) can skip both.
   ===================================================================== */
(function (w) {
  'use strict';

  // ⬇⬇⬇  PASTE THE APPS SCRIPT /exec URL HERE (Deploy → Web app → copy the URL ending in /exec)
  var SURVEY_URL = '';
  // ⬆⬆⬆  While it is empty the payload is logged to the console and the survey still unlocks.

  var TRAINING = 'hwcw';
  var COURSE = 'Boost Homework & Classwork Submission';
  var START_KEY = 'kl-start-survey-' + TRAINING;
  var FINAL_KEY = 'kl-final-survey-' + TRAINING;
  var DEV = /[?&]dev=1(&|$)/.test(location.search);

  function S() { return w.STORE || { get: function () { return null; }, set: function () {} }; }
  function lang() { try { var e = w.__HWCW; return (e ? e.lang() : w.LANG) || 'en'; } catch (e2) { return 'en'; } }

  var REGION_BY_LANG = { es: 'latam', br: 'brazil', pt: 'brazil', it: 'italy', pl: 'poland', ru: 'cis', tr: 'mena', id: 'indonesia' };
  var REGIONS = ['brazil', 'latam', 'mena', 'italy', 'poland', 'uk', 'usa', 'indonesia', 'gcc', 'cis'];

  /* ---------- texts ---------- */
  var T = {
    en: { title: 'Before you start', intro: 'Two quick questions before the training. It takes under a minute.',
      email: 'Corporate e-mail', emailHint: 'Must be your @kodland address', region: 'Region',
      send: 'Send and start', sending: 'Sending…', pick: 'Choose…',
      errEmail: 'Please enter your @kodland e-mail.', errReq: 'Please answer this question.',
      s1: 'Not at all', s5: 'Completely',
      feeling: 'How do you feel about this new launch right now?',
      confidence: 'How confident do you feel about teaching this new course or format?',
      understand_why: 'I understand why we are making this change.',
      know_where: 'I know where to find what I need and who to ask for help.',
      worries: 'What worries you most about this launch? (optional)',
      fTitle: 'Final survey', fIntro: 'Last step before the check of this module.',
      g1: 'How you feel', g2: 'Your confidence to teach', g3: 'The training materials',
      feeling2: 'How do you feel about this new launch now?',
      ready_first_lesson: 'I feel ready to run my first lesson from start to finish.',
      know_course: 'I know what students do and achieve in this course.',
      ready_tools: 'I feel ready to use Back Office, the Classroom and the tools in class.',
      training_clear: 'The training was clear and easy to follow.',
      simulators_helped: 'The sorting challenge and the quizzes helped me feel more confident.',
      fSend: 'Send the survey', fDone: '✅ Thank you! The check is unlocked.',
      locked: '🔒 Send the survey above to unlock the module check.',
      opts: { excited: 'Excited 🤩', curious: 'Curious 🤔', calm: 'Calm 😌', unsure: 'Unsure 😕', worried: 'Worried 😟', overwhelmed: 'Overwhelmed 😵' } },

    id: { title: 'Sebelum kamu mulai', intro: 'Dua pertanyaan singkat sebelum training. Kurang dari satu menit.',
      email: 'Email korporat', emailHint: 'Harus alamat @kodland kamu', region: 'Region',
      send: 'Kirim dan mulai', sending: 'Mengirim…', pick: 'Pilih…',
      errEmail: 'Masukkan email @kodland kamu.', errReq: 'Mohon jawab pertanyaan ini.',
      s1: 'Sama sekali tidak', s5: 'Sepenuhnya',
      feeling: 'Bagaimana perasaanmu tentang peluncuran baru ini sekarang?',
      confidence: 'Seberapa percaya diri kamu mengajar kursus atau format baru ini?',
      understand_why: 'Aku paham kenapa kita melakukan perubahan ini.',
      know_where: 'Aku tahu di mana mencari yang kubutuhkan dan ke siapa harus bertanya.',
      worries: 'Apa yang paling kamu khawatirkan soal peluncuran ini? (opsional)',
      fTitle: 'Survei akhir', fIntro: 'Langkah terakhir sebelum check modul ini.',
      g1: 'Perasaanmu', g2: 'Kepercayaan dirimu mengajar', g3: 'Materi training',
      feeling2: 'Bagaimana perasaanmu tentang peluncuran baru ini sekarang?',
      ready_first_lesson: 'Aku merasa siap menjalankan lesson pertamaku dari awal sampai akhir.',
      know_course: 'Aku tahu apa yang siswa kerjakan dan capai di kursus ini.',
      ready_tools: 'Aku merasa siap memakai Back Office, Classroom, dan tool di kelas.',
      training_clear: 'Training ini jelas dan mudah diikuti.',
      simulators_helped: 'Sorting challenge dan kuisnya membuatku lebih percaya diri.',
      fSend: 'Kirim survei', fDone: '✅ Terima kasih! Check-nya sudah terbuka.',
      locked: '🔒 Kirim survei di atas untuk membuka check modul ini.',
      opts: { excited: 'Antusias 🤩', curious: 'Penasaran 🤔', calm: 'Tenang 😌', unsure: 'Ragu 😕', worried: 'Khawatir 😟', overwhelmed: 'Kewalahan 😵' } },

    es: { title: 'Antes de empezar', intro: 'Dos preguntas rápidas antes de la capacitación. Menos de un minuto.',
      email: 'Correo corporativo', emailHint: 'Debe ser tu dirección @kodland', region: 'Región',
      send: 'Enviar y empezar', sending: 'Enviando…', pick: 'Elige…',
      errEmail: 'Ingresa tu correo @kodland.', errReq: 'Por favor responde esta pregunta.',
      s1: 'Para nada', s5: 'Completamente',
      feeling: '¿Cómo te sientes con este nuevo lanzamiento ahora mismo?',
      confidence: '¿Qué tan seguro te sientes de enseñar este nuevo curso o formato?',
      understand_why: 'Entiendo por qué estamos haciendo este cambio.',
      know_where: 'Sé dónde encontrar lo que necesito y a quién pedir ayuda.',
      worries: '¿Qué es lo que más te preocupa de este lanzamiento? (opcional)',
      fTitle: 'Encuesta final', fIntro: 'Último paso antes del test de este módulo.',
      g1: 'Cómo te sientes', g2: 'Tu confianza para enseñar', g3: 'Los materiales',
      feeling2: '¿Cómo te sientes con este nuevo lanzamiento ahora?',
      ready_first_lesson: 'Me siento listo para dar mi primera clase de principio a fin.',
      know_course: 'Sé qué hacen y qué logran los estudiantes en este curso.',
      ready_tools: 'Me siento listo para usar Back Office, el Classroom y las herramientas en clase.',
      training_clear: 'La capacitación fue clara y fácil de seguir.',
      simulators_helped: 'El desafío de clasificación y los test me ayudaron a sentirme más seguro.',
      fSend: 'Enviar la encuesta', fDone: '✅ ¡Gracias! El test está desbloqueado.',
      locked: '🔒 Envía la encuesta de arriba para desbloquear el test del módulo.',
      opts: { excited: 'Entusiasmado 🤩', curious: 'Con curiosidad 🤔', calm: 'Tranquilo 😌', unsure: 'Con dudas 😕', worried: 'Preocupado 😟', overwhelmed: 'Abrumado 😵' } },

    br: { title: 'Antes de começar', intro: 'Duas perguntas rápidas antes do treinamento. Menos de um minuto.',
      email: 'E-mail corporativo', emailHint: 'Precisa ser seu endereço @kodland', region: 'Região',
      send: 'Enviar e começar', sending: 'Enviando…', pick: 'Escolha…',
      errEmail: 'Digite seu e-mail @kodland.', errReq: 'Por favor responda esta pergunta.',
      s1: 'Nada', s5: 'Completamente',
      feeling: 'Como você se sente sobre este novo lançamento agora?',
      confidence: 'Quão confiante você se sente para dar este novo curso ou formato?',
      understand_why: 'Eu entendo por que estamos fazendo esta mudança.',
      know_where: 'Eu sei onde encontrar o que preciso e a quem pedir ajuda.',
      worries: 'O que mais te preocupa neste lançamento? (opcional)',
      fTitle: 'Pesquisa final', fIntro: 'Último passo antes do check deste módulo.',
      g1: 'Como você se sente', g2: 'Sua confiança para ensinar', g3: 'Os materiais',
      feeling2: 'Como você se sente sobre este novo lançamento agora?',
      ready_first_lesson: 'Me sinto pronto para dar minha primeira aula do início ao fim.',
      know_course: 'Sei o que os alunos fazem e alcançam neste curso.',
      ready_tools: 'Me sinto pronto para usar o Back Office, o Classroom e as ferramentas na aula.',
      training_clear: 'O treinamento foi claro e fácil de acompanhar.',
      simulators_helped: 'O desafio de classificação e os quizzes me deixaram mais confiante.',
      fSend: 'Enviar a pesquisa', fDone: '✅ Obrigado! O check foi desbloqueado.',
      locked: '🔒 Envie a pesquisa acima para desbloquear o check do módulo.',
      opts: { excited: 'Animado 🤩', curious: 'Curioso 🤔', calm: 'Tranquilo 😌', unsure: 'Em dúvida 😕', worried: 'Preocupado 😟', overwhelmed: 'Sobrecarregado 😵' } },

    it: { title: 'Prima di iniziare', intro: 'Due domande rapide prima della formazione. Meno di un minuto.',
      email: 'E-mail aziendale', emailHint: 'Deve essere il tuo indirizzo @kodland', region: 'Regione',
      send: 'Invia e inizia', sending: 'Invio…', pick: 'Scegli…',
      errEmail: 'Inserisci la tua e-mail @kodland.', errReq: 'Rispondi a questa domanda.',
      s1: 'Per niente', s5: 'Completamente',
      feeling: 'Come ti senti riguardo a questo nuovo lancio in questo momento?',
      confidence: 'Quanto ti senti sicuro nell\'insegnare questo nuovo corso o formato?',
      understand_why: 'Capisco perché stiamo facendo questo cambiamento.',
      know_where: 'So dove trovare ciò che mi serve e a chi chiedere aiuto.',
      worries: 'Cosa ti preoccupa di più di questo lancio? (facoltativo)',
      fTitle: 'Sondaggio finale', fIntro: 'Ultimo passo prima del test di questo modulo.',
      g1: 'Come ti senti', g2: 'La tua sicurezza nell\'insegnare', g3: 'I materiali',
      feeling2: 'Come ti senti riguardo a questo nuovo lancio adesso?',
      ready_first_lesson: 'Mi sento pronto a tenere la mia prima lezione dall\'inizio alla fine.',
      know_course: 'So cosa fanno e cosa ottengono gli studenti in questo corso.',
      ready_tools: 'Mi sento pronto a usare il Back Office, la Classroom e gli strumenti in classe.',
      training_clear: 'La formazione è stata chiara e facile da seguire.',
      simulators_helped: 'La sfida di classificazione e i test mi hanno dato più sicurezza.',
      fSend: 'Invia il sondaggio', fDone: '✅ Grazie! Il test è sbloccato.',
      locked: '🔒 Invia il sondaggio qui sopra per sbloccare il test del modulo.',
      opts: { excited: 'Entusiasta 🤩', curious: 'Curioso 🤔', calm: 'Tranquillo 😌', unsure: 'Incerto 😕', worried: 'Preoccupato 😟', overwhelmed: 'Sopraffatto 😵' } },

    pl: { title: 'Zanim zaczniesz', intro: 'Dwa szybkie pytania przed szkoleniem. Zajmie mniej niż minutę.',
      email: 'E-mail służbowy', emailHint: 'Musi być Twój adres @kodland', region: 'Region',
      send: 'Wyślij i zacznij', sending: 'Wysyłanie…', pick: 'Wybierz…',
      errEmail: 'Podaj swój e-mail @kodland.', errReq: 'Odpowiedz na to pytanie.',
      s1: 'Wcale', s5: 'Całkowicie',
      feeling: 'Jak się czujesz z tym nowym wdrożeniem w tej chwili?',
      confidence: 'Jak pewnie czujesz się, ucząc tego nowego kursu lub formatu?',
      understand_why: 'Rozumiem, dlaczego wprowadzamy tę zmianę.',
      know_where: 'Wiem, gdzie znaleźć to, czego potrzebuję, i kogo prosić o pomoc.',
      worries: 'Co najbardziej Cię niepokoi w tym wdrożeniu? (opcjonalne)',
      fTitle: 'Ankieta końcowa', fIntro: 'Ostatni krok przed testem tego modułu.',
      g1: 'Jak się czujesz', g2: 'Twoja pewność w nauczaniu', g3: 'Materiały szkoleniowe',
      feeling2: 'Jak się teraz czujesz z tym nowym wdrożeniem?',
      ready_first_lesson: 'Czuję się gotowy poprowadzić pierwszą lekcję od początku do końca.',
      know_course: 'Wiem, co uczniowie robią i osiągają na tym kursie.',
      ready_tools: 'Czuję się gotowy używać Back Office, Classroom i narzędzi na zajęciach.',
      training_clear: 'Szkolenie było jasne i łatwe do przejścia.',
      simulators_helped: 'Wyzwanie sortowania i quizy dodały mi pewności.',
      fSend: 'Wyślij ankietę', fDone: '✅ Dziękujemy! Test został odblokowany.',
      locked: '🔒 Wyślij ankietę powyżej, aby odblokować test modułu.',
      opts: { excited: 'Podekscytowany 🤩', curious: 'Ciekawy 🤔', calm: 'Spokojny 😌', unsure: 'Niepewny 😕', worried: 'Zaniepokojony 😟', overwhelmed: 'Przytłoczony 😵' } },

    ru: { title: 'Перед началом', intro: 'Два быстрых вопроса перед обучением. Займёт меньше минуты.',
      email: 'Рабочая почта', emailHint: 'Должен быть твой адрес @kodland', region: 'Регион',
      send: 'Отправить и начать', sending: 'Отправка…', pick: 'Выбери…',
      errEmail: 'Укажи свою почту @kodland.', errReq: 'Пожалуйста, ответь на этот вопрос.',
      s1: 'Совсем нет', s5: 'Полностью',
      feeling: 'Что ты сейчас чувствуешь по поводу этого запуска?',
      confidence: 'Насколько уверенно ты себя чувствуешь, преподавая этот новый курс или формат?',
      understand_why: 'Я понимаю, зачем мы делаем это изменение.',
      know_where: 'Я знаю, где找 найти нужное и у кого спросить помощь.',
      worries: 'Что тебя больше всего беспокоит в этом запуске? (необязательно)',
      fTitle: 'Финальный опрос', fIntro: 'Последний шаг перед проверкой этого модуля.',
      g1: 'Как ты себя чувствуешь', g2: 'Твоя уверенность в преподавании', g3: 'Материалы обучения',
      feeling2: 'Что ты чувствуешь по поводу этого запуска сейчас?',
      ready_first_lesson: 'Я чувствую себя готовым провести первое занятие от начала до конца.',
      know_course: 'Я знаю, что ученики делают и чего достигают на этом курсе.',
      ready_tools: 'Я готов использовать Back Office, Classroom и инструменты на занятии.',
      training_clear: 'Обучение было понятным и лёгким для прохождения.',
      simulators_helped: 'Сортировка и тесты помогли мне почувствовать себя увереннее.',
      fSend: 'Отправить опрос', fDone: '✅ Спасибо! Проверка открыта.',
      locked: '🔒 Отправь опрос выше, чтобы открыть проверку модуля.',
      opts: { excited: 'Воодушевлён 🤩', curious: 'Любопытно 🤔', calm: 'Спокоен 😌', unsure: 'Не уверен 😕', worried: 'Беспокоюсь 😟', overwhelmed: 'Перегружен 😵' } },

    tr: { title: 'Başlamadan önce', intro: 'Eğitimden önce iki kısa soru. Bir dakikadan az sürer.',
      email: 'Kurumsal e-posta', emailHint: '@kodland adresin olmalı', region: 'Bölge',
      send: 'Gönder ve başla', sending: 'Gönderiliyor…', pick: 'Seç…',
      errEmail: '@kodland e-postanı gir.', errReq: 'Lütfen bu soruyu yanıtla.',
      s1: 'Hiç', s5: 'Tamamen',
      feeling: 'Bu yeni başlangıç hakkında şu anda nasıl hissediyorsun?',
      confidence: 'Bu yeni kursu veya formatı vermek konusunda kendini ne kadar hazır hissediyorsun?',
      understand_why: 'Bu değişikliği neden yaptığımızı anlıyorum.',
      know_where: 'İhtiyacım olanı nerede bulacağımı ve kime soracağımı biliyorum.',
      worries: 'Bu başlangıçla ilgili seni en çok ne endişelendiriyor? (isteğe bağlı)',
      fTitle: 'Son anket', fIntro: 'Bu modülün kontrolünden önceki son adım.',
      g1: 'Nasıl hissediyorsun', g2: 'Öğretme konusundaki güvenin', g3: 'Eğitim materyalleri',
      feeling2: 'Bu yeni başlangıç hakkında şimdi nasıl hissediyorsun?',
      ready_first_lesson: 'İlk dersimi baştan sona verebilecek kadar hazır hissediyorum.',
      know_course: 'Öğrencilerin bu kursta ne yaptığını ve ne kazandığını biliyorum.',
      ready_tools: 'Back Office, Classroom ve sınıftaki araçları kullanmaya hazırım.',
      training_clear: 'Eğitim açıktı ve takip etmesi kolaydı.',
      simulators_helped: 'Sıralama görevi ve testler kendimi daha güvende hissettirdi.',
      fSend: 'Anketi gönder', fDone: '✅ Teşekkürler! Kontrol açıldı.',
      locked: '🔒 Modül kontrolünü açmak için yukarıdaki anketi gönder.',
      opts: { excited: 'Heyecanlı 🤩', curious: 'Meraklı 🤔', calm: 'Sakin 😌', unsure: 'Kararsız 😕', worried: 'Endişeli 😟', overwhelmed: 'Bunalmış 😵' } },

    ar: { title: 'قبل أن تبدأ', intro: 'سؤالان سريعان قبل التدريب. يستغرق أقل من دقيقة.',
      email: 'البريد المؤسسي', emailHint: 'يجب أن يكون عنوان @kodland الخاص بك', region: 'المنطقة',
      send: 'إرسال والبدء', sending: 'جارٍ الإرسال…', pick: 'اختر…',
      errEmail: 'أدخل بريدك @kodland.', errReq: 'يرجى الإجابة على هذا السؤال.',
      s1: 'إطلاقًا', s5: 'تمامًا',
      feeling: 'كيف تشعر تجاه هذا الإطلاق الجديد الآن؟',
      confidence: 'ما مدى ثقتك في تدريس هذه الدورة أو الصيغة الجديدة؟',
      understand_why: 'أفهم لماذا نقوم بهذا التغيير.',
      know_where: 'أعرف أين أجد ما أحتاجه ومن أسأل للمساعدة.',
      worries: 'ما الذي يقلقك أكثر بشأن هذا الإطلاق؟ (اختياري)',
      fTitle: 'الاستبيان النهائي', fIntro: 'الخطوة الأخيرة قبل اختبار هذه الوحدة.',
      g1: 'كيف تشعر', g2: 'ثقتك في التدريس', g3: 'مواد التدريب',
      feeling2: 'كيف تشعر تجاه هذا الإطلاق الجديد الآن؟',
      ready_first_lesson: 'أشعر أنني جاهز لتقديم حصتي الأولى من البداية إلى النهاية.',
      know_course: 'أعرف ما الذي يفعله الطلاب وما يحققونه في هذه الدورة.',
      ready_tools: 'أشعر أنني جاهز لاستخدام Back Office والفصل والأدوات في الحصة.',
      training_clear: 'كان التدريب واضحًا وسهل المتابعة.',
      simulators_helped: 'ساعدني تحدي التصنيف والاختبارات على الشعور بثقة أكبر.',
      fSend: 'إرسال الاستبيان', fDone: '✅ شكرًا لك! تم فتح الاختبار.',
      locked: '🔒 أرسل الاستبيان أعلاه لفتح اختبار الوحدة.',
      opts: { excited: 'متحمس 🤩', curious: 'فضولي 🤔', calm: 'هادئ 😌', unsure: 'غير متأكد 😕', worried: 'قلق 😟', overwhelmed: 'مرهق 😵' } }
  };
  function tx() { return T[lang()] || T.en; }

  var FEELINGS = ['excited', 'curious', 'calm', 'unsure', 'worried', 'overwhelmed'];

  /* ---------- styles ---------- */
  var css =
    '.hws-ov{position:fixed;inset:0;background:rgba(12,10,30,.72);z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto}' +
    '.hws-bx{background:#fff;color:#1B1240;max-width:560px;width:100%;border-radius:20px;padding:26px;box-shadow:0 18px 50px rgba(0,0,0,.3);max-height:92vh;overflow:auto}' +
    '.hws-bx h2{font-size:21px;margin:0 0 6px;font-weight:800}.hws-bx p.hws-i{margin:0 0 16px;color:#5B5277;font-size:14px}' +
    '.hws-f{margin:14px 0}.hws-f label{display:block;font-weight:700;font-size:14px;margin-bottom:6px}' +
    '.hws-f input[type=text],.hws-f input[type=email],.hws-f select,.hws-f textarea{width:100%;padding:10px 12px;border:2px solid #E3DEF2;border-radius:12px;font:inherit;font-size:14px;background:#fff;color:#1B1240;box-sizing:border-box}' +
    '.hws-hint{font-size:12px;color:#7A7193;margin-top:4px}' +
    '.hws-ch{display:flex;flex-wrap:wrap;gap:8px}' +
    '.hws-ch button{border:2px solid #E3DEF2;background:#fff;border-radius:999px;padding:8px 14px;font:inherit;font-size:13.5px;cursor:pointer;color:#1B1240}' +
    '.hws-ch button[aria-pressed=true]{background:#7C3AED;border-color:#7C3AED;color:#fff;font-weight:700}' +
    '.hws-sc{display:flex;gap:6px;align-items:center;flex-wrap:wrap}' +
    '.hws-sc button{width:42px;height:42px;border-radius:12px;border:2px solid #E3DEF2;background:#fff;font:inherit;font-weight:700;cursor:pointer;color:#1B1240}' +
    '.hws-sc button[aria-pressed=true]{background:#7C3AED;border-color:#7C3AED;color:#fff}' +
    '.hws-sl{font-size:11.5px;color:#7A7193}' +
    '.hws-go{margin-top:18px;width:100%;border:0;border-radius:999px;padding:13px;background:#7C3AED;color:#fff;font:inherit;font-weight:800;font-size:15px;cursor:pointer}' +
    '.hws-go[disabled]{opacity:.6;cursor:wait}' +
    '.hws-err{color:#C62828;font-size:12.5px;margin-top:5px;font-weight:600}' +
    '.hws-grp{font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.4px;color:#7C3AED;margin:20px 0 4px}' +
    '.hws-card{border:2px solid #E3DEF2;border-radius:18px;padding:20px;margin:18px 0;background:#FBFAFF}' +
    '.hws-lock{margin:14px 0;padding:12px 16px;border-radius:14px;background:#FFF7E6;border:2px solid #F5A524;color:#5A4300;font-weight:700;font-size:14px}' +
    '.hws-ok{margin:14px 0;padding:12px 16px;border-radius:14px;background:#E8F7EE;border:2px solid #34A853;color:#17502C;font-weight:700;font-size:14px}' +
    '[dir=rtl] .hws-bx{text-align:right}';
  var sEl = document.createElement('style'); sEl.textContent = css;
  (document.head || document.documentElement).appendChild(sEl);

  /* ---------- sending ---------- */
  function send(payload) {
    payload.training = TRAINING;
    payload.course = COURSE;
    payload.lang = lang();
    payload.sent_at = new Date().toISOString();
    try {
      if (!SURVEY_URL) { console.log('[HW/CW survey] SURVEY_URL is empty — payload:', payload); return; }
      fetch(SURVEY_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
    } catch (e) { console.log('[HW/CW survey] send failed, continuing:', e); }
  }

  /* ---------- small builders ---------- */
  function choiceRow(name, state) {
    var t = tx(), wrapEl = document.createElement('div'); wrapEl.className = 'hws-ch';
    FEELINGS.forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = t.opts[k]; b.setAttribute('aria-pressed', 'false');
      b.onclick = function () {
        state[name] = k;
        Array.prototype.forEach.call(wrapEl.children, function (c) { c.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
      };
      wrapEl.appendChild(b);
    });
    return wrapEl;
  }
  function scaleRow(name, state) {
    var t = tx(), box = document.createElement('div');
    var row = document.createElement('div'); row.className = 'hws-sc';
    var lo = document.createElement('span'); lo.className = 'hws-sl'; lo.textContent = t.s1; row.appendChild(lo);
    for (var i = 1; i <= 5; i++) {
      (function (n) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = n; b.setAttribute('aria-pressed', 'false');
        b.onclick = function () {
          state[name] = n;
          Array.prototype.forEach.call(row.querySelectorAll('button'), function (c) { c.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
        };
        row.appendChild(b);
      })(i);
    }
    var hi = document.createElement('span'); hi.className = 'hws-sl'; hi.textContent = t.s5; row.appendChild(hi);
    box.appendChild(row);
    return box;
  }
  function field(labelText, node) {
    var f = document.createElement('div'); f.className = 'hws-f';
    var l = document.createElement('label'); l.textContent = labelText; f.appendChild(l); f.appendChild(node);
    return f;
  }
  function errLine() { var e = document.createElement('div'); e.className = 'hws-err'; e.style.display = 'none'; return e; }

  /* ---------- START SURVEY ---------- */
  function startDone() { return !!S().get(START_KEY); }

  function showStart() {
    var t = tx(), state = {};
    var ov = document.createElement('div'); ov.className = 'hws-ov';
    var bx = document.createElement('div'); bx.className = 'hws-bx';
    ov.appendChild(bx);

    var h = document.createElement('h2'); h.textContent = t.title; bx.appendChild(h);
    var ip = document.createElement('p'); ip.className = 'hws-i'; ip.textContent = t.intro; bx.appendChild(ip);

    var email = document.createElement('input'); email.type = 'email'; email.placeholder = 'name@kodland.org';
    var fEmail = field(t.email, email);
    var hint = document.createElement('div'); hint.className = 'hws-hint'; hint.textContent = t.emailHint; fEmail.appendChild(hint);
    var eEmail = errLine(); fEmail.appendChild(eEmail); bx.appendChild(fEmail);

    var sel = document.createElement('select');
    var o0 = document.createElement('option'); o0.value = ''; o0.textContent = t.pick; sel.appendChild(o0);
    REGIONS.forEach(function (r) { var o = document.createElement('option'); o.value = r; o.textContent = r; sel.appendChild(o); });
    var pre = REGION_BY_LANG[lang()]; if (pre) sel.value = pre;
    var fRegion = field(t.region, sel); var eRegion = errLine(); fRegion.appendChild(eRegion); bx.appendChild(fRegion);

    var fFeel = field(t.feeling, choiceRow('feeling', state)); var eFeel = errLine(); fFeel.appendChild(eFeel); bx.appendChild(fFeel);
    var fConf = field(t.confidence, scaleRow('confidence', state)); var eConf = errLine(); fConf.appendChild(eConf); bx.appendChild(fConf);
    var fWhy = field(t.understand_why, scaleRow('understand_why', state)); var eWhy = errLine(); fWhy.appendChild(eWhy); bx.appendChild(fWhy);
    var fKnow = field(t.know_where, scaleRow('know_where', state)); var eKnow = errLine(); fKnow.appendChild(eKnow); bx.appendChild(fKnow);

    var ta = document.createElement('textarea'); ta.rows = 3;
    bx.appendChild(field(t.worries, ta));

    var go = document.createElement('button'); go.className = 'hws-go'; go.type = 'button'; go.textContent = t.send;
    bx.appendChild(go);

    if (DEV) {
      var skip = document.createElement('button');
      skip.className = 'hws-go'; skip.type = 'button';
      skip.style.background = '#8A8398'; skip.style.marginTop = '8px';
      skip.textContent = 'DEV: skip survey';
      skip.onclick = function () { ov.remove(); };
      bx.appendChild(skip);
    }

    go.onclick = function () {
      var ok = true;
      function mark(el, cond, msg) {
        if (cond) { el.style.display = 'none'; return true; }
        el.textContent = msg; el.style.display = 'block'; ok = false; return false;
      }
      mark(eEmail, /@kodland/i.test(email.value.trim()), t.errEmail);
      mark(eRegion, !!sel.value, t.errReq);
      mark(eFeel, !!state.feeling, t.errReq);
      mark(eConf, !!state.confidence, t.errReq);
      mark(eWhy, !!state.understand_why, t.errReq);
      mark(eKnow, !!state.know_where, t.errReq);
      if (!ok) return;

      go.disabled = true; go.textContent = t.sending;
      var identity = { email: email.value.trim(), region: sel.value };
      send({
        survey: 'start', email: identity.email, region: identity.region,
        feeling: state.feeling, confidence: state.confidence,
        understand_why: state.understand_why, know_where: state.know_where,
        worries: ta.value.trim()
      });
      try { S().set(START_KEY, JSON.stringify(identity)); } catch (e) {}
      try { S().set('kl-m0-identity', JSON.stringify(identity)); } catch (e) {}   // td-time.js reads this
      ov.remove();
    };

    document.body.appendChild(ov);
    setTimeout(function () { try { email.focus(); } catch (e) {} }, 60);
  }

  /* ---------- FINAL SURVEY ---------- */
  function finalDone() { return S().get(FINAL_KEY) === '1'; }

  function buildFinal(onSent) {
    var t = tx(), state = {};
    var card = document.createElement('div'); card.className = 'hws-card';
    var h = document.createElement('h2'); h.textContent = t.fTitle;
    h.style.cssText = 'font-size:19px;font-weight:800;margin:0 0 4px'; card.appendChild(h);
    var ip = document.createElement('p'); ip.className = 'hws-i'; ip.textContent = t.fIntro; card.appendChild(ip);

    function grp(txt) { var d = document.createElement('div'); d.className = 'hws-grp'; d.textContent = txt; card.appendChild(d); }

    grp(t.g1);
    var eFeel = errLine(), fFeel = field(t.feeling2, choiceRow('feeling', state)); fFeel.appendChild(eFeel); card.appendChild(fFeel);
    var eConf = errLine(), fConf = field(t.confidence, scaleRow('confidence', state)); fConf.appendChild(eConf); card.appendChild(fConf);
    var eWhy = errLine(), fWhy = field(t.understand_why, scaleRow('understand_why', state)); fWhy.appendChild(eWhy); card.appendChild(fWhy);
    var eKnow = errLine(), fKnow = field(t.know_where, scaleRow('know_where', state)); fKnow.appendChild(eKnow); card.appendChild(fKnow);

    grp(t.g2);
    var eRdy = errLine(), fRdy = field(t.ready_first_lesson, scaleRow('ready_first_lesson', state)); fRdy.appendChild(eRdy); card.appendChild(fRdy);
    var eKc = errLine(), fKc = field(t.know_course, scaleRow('know_course', state)); fKc.appendChild(eKc); card.appendChild(fKc);
    var eTool = errLine(), fTool = field(t.ready_tools, scaleRow('ready_tools', state)); fTool.appendChild(eTool); card.appendChild(fTool);

    grp(t.g3);
    var eClr = errLine(), fClr = field(t.training_clear, scaleRow('training_clear', state)); fClr.appendChild(eClr); card.appendChild(fClr);
    var eSim = errLine(), fSim = field(t.simulators_helped, scaleRow('simulators_helped', state)); fSim.appendChild(eSim); card.appendChild(fSim);

    var go = document.createElement('button'); go.className = 'hws-go'; go.type = 'button'; go.textContent = t.fSend;
    card.appendChild(go);

    if (DEV) {
      var skip = document.createElement('button');
      skip.className = 'hws-go'; skip.type = 'button';
      skip.style.background = '#8A8398'; skip.style.marginTop = '8px';
      skip.textContent = 'DEV: skip survey';
      skip.onclick = function () { try { S().set(FINAL_KEY, '1'); } catch (e) {} onSent(); };
      card.appendChild(skip);
    }

    go.onclick = function () {
      var ok = true;
      function mark(el, cond) { if (cond) { el.style.display = 'none'; return; } el.textContent = t.errReq; el.style.display = 'block'; ok = false; }
      mark(eFeel, !!state.feeling); mark(eConf, !!state.confidence);
      mark(eWhy, !!state.understand_why); mark(eKnow, !!state.know_where);
      mark(eRdy, !!state.ready_first_lesson); mark(eKc, !!state.know_course);
      mark(eTool, !!state.ready_tools); mark(eClr, !!state.training_clear);
      mark(eSim, !!state.simulators_helped);
      if (!ok) return;

      go.disabled = true; go.textContent = t.sending;
      var id = {}; try { id = JSON.parse(S().get(START_KEY) || '{}') || {}; } catch (e) {}
      var payload = { survey: 'final', email: id.email || '', region: id.region || '' };
      Object.keys(state).forEach(function (k) { payload[k] = state[k]; });
      send(payload);
      try { S().set(FINAL_KEY, '1'); } catch (e) {}
      onSent();
    };
    return card;
  }

  /* ---------- wire the final survey into the LAST module ---------- */
  function lastModuleId() {
    try { var e = w.__HWCW, m = e ? e.mods() : w.MODULES; return m && m.length ? m[m.length - 1].id : null; } catch (e2) { return null; }
  }

  function injectFinal() {
    if (DEV && finalDone()) return;
    var body = document.getElementById('cbody');
    if (!body) return;
    if (body.querySelector('.hws-card') || body.querySelector('.hws-ok')) return;
    var cur = (function () { try { var e = w.__HWCW; return e ? e.cur() : w.currentModule; } catch (e2) { return null; } })();
    if (cur !== lastModuleId()) return;

    var cta = body.querySelector('.ctabtn');
    var t = tx();

    if (finalDone()) {
      if (cta && !body.querySelector('.hws-ok')) {
        var ok = document.createElement('div'); ok.className = 'hws-ok'; ok.textContent = t.fDone;
        cta.parentNode.insertBefore(ok, cta);
      }
      return;
    }

    if (!cta) return;
    var lock = document.createElement('div'); lock.className = 'hws-lock'; lock.textContent = t.locked;
    var card = buildFinal(function () {
      card.remove(); lock.remove();
      cta.style.display = '';
      var ok2 = document.createElement('div'); ok2.className = 'hws-ok'; ok2.textContent = t.fDone;
      cta.parentNode.insertBefore(ok2, cta);
    });
    cta.parentNode.insertBefore(card, cta);
    cta.parentNode.insertBefore(lock, cta);
    cta.style.display = 'none';
  }

  function wrapOpenModule() {
    if (typeof w.openModule !== 'function' || w.openModule.__hws) return;
    var orig = w.openModule;
    var wrapped = function () {
      var r = orig.apply(this, arguments);
      try { setTimeout(injectFinal, 0); } catch (e) {}
      return r;
    };
    wrapped.__hws = true;
    w.openModule = wrapped;
  }

  function boot() {
    if (!DEV && !startDone()) showStart();
    wrapOpenModule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  else setTimeout(boot, 0);
})(window);
