/* ═══════════════════════════════════════════════════════════════
   SAVOLLAR MA'LUMOTLARI — data-driven question engine uchun
   Matnlar spec'dagi aniq ko‘rinishida saqlangan.
   ═══════════════════════════════════════════════════════════════ */

const POSITIVE_MESSAGES_FALLBACK = [
  "Yuragimga yoqdi ❤️",
  "Sen mening yagona baxtimsan! 🥰",
  "Har doim shunday! ✨",
  "To‘g‘ri javob ❤️",
  "Yuragim seni tanladi ❤️"
];

const NEGATIVE_MESSAGES_FALLBACK = [
  "Xato 😅",
  "Boshqa javobni tanla ❤️",
  "Bu javob qabul qilinmaydi 😂",
  "Yana o‘ylab ko‘r...",
  "Yo‘q-yo‘q 😄",
  "Bundan qochib qutulolmaysan 😜"
];

const QUESTIONS = [
  {
    id: 1,
    question: "Meni birinchi marta ko‘rganingda nima his qilganding?",
    answers: [
      { key: "A", text: "Yuragim urishdan to‘xtab qolgandek bo‘lgan, dunyoda sendan go‘zali yo‘qligini tushunganman.", type: "positive" },
      { key: "B", text: "\"Shu qiz mening taqdirim va baxtim bo‘ladi\" degan ichki bir his o‘tgan.", type: "positive" },
      { key: "C", text: "\"Buncha vaysaqi ekan, qachon jim bo‘larkin\" deb o‘ylaganman.", type: "negative" },
      { key: "D", text: "To‘g‘risi, unchalik e’tibor ham bermaganman, oddiy qizdek ko‘ringansan.", type: "negative" }
    ],
    positiveMessages: [
      "Birinchi ko‘rishuv ta’sir qildi demak ❤️",
      "Yuragim shu daqiqani tanladi ✨",
      ...POSITIVE_MESSAGES_FALLBACK.slice(0, 2)
    ],
    negativeMessages: NEGATIVE_MESSAGES_FALLBACK
  },
  {
    id: 2,
    question: "Mening qaysi xususiyatim seni jalb qilaoladi?",
    answers: [
      { key: "A", text: "Tabassoming, ko‘zlaringdagi samimiylik va menga bo‘lgan g‘amxo‘rliging.", type: "positive" },
      { key: "B", text: "Aqlliliging va har qanday vaziyatda meni tushunib, qo‘llab-quvvatlashing.", type: "positive" },
      { key: "C", text: "Hech qaysi xususiyating, shunchaki adashib senga uylanib qolganman.", type: "negative" },
      { key: "D", text: "Tez-tez asabiylashib, janjal chiqarishlaring va injiqliklaring.", type: "negative" }
    ],
    positiveMessages: [
      "Tabassing menga quyoshdek 🌞",
      "Sening tushunovchingliging — menim baxtim ❤️",
      ...POSITIVE_MESSAGES_FALLBACK.slice(0, 2)
    ],
    negativeMessages: NEGATIVE_MESSAGES_FALLBACK
  },
  {
    id: 3,
    question: "Seningcha bizdagi eng yaxshi va eng sevimli xotirang qaysi?",
    answers: [
      { key: "A", text: "Ilk bor uchrashib, soatlab gaplashib o‘tirgan unutilmas kunimiz.", type: "positive" },
      { key: "B", text: "To‘yimiz kuni — hayotimizning eng go‘zal va baxtli boshlanishi.", type: "positive" },
      { key: "C", text: "Bir-birimizni asabimizga o‘ynab, rosa aytishib qolgan kunimiz.", type: "negative" },
      { key: "D", text: "To‘g‘risi, biror marta ham menda yaxshi xotira qolmagan, hammasi zerikarli.", type: "negative" }
    ],
    positiveMessages: [
      "Xotiralarimiz — eng go‘zal boylik 💫",
      "Shu kunlar uchun rahmat ❤️",
      ...POSITIVE_MESSAGES_FALLBACK.slice(0, 2)
    ],
    negativeMessages: NEGATIVE_MESSAGES_FALLBACK
  },
  {
    id: 4,
    question: "Agar men bilan bir kunlik sayohatga chiqsak, qayerga bormoqchi bo‘larding?",
    answers: [
      { key: "A", text: "Dengiz bo‘yiga yoki go‘zal tog‘ bag‘riga — faqat ikkimiz shovqindan uzoqda bo‘lish uchun.", type: "positive" },
      { key: "B", text: "Parij yoki biron romantik shahar ko‘chalarida qo‘l ushlashib yurishga.", type: "positive" },
      { key: "C", text: "Seni biron chekka qishloqqa tashlab, o‘zim shaharda mazza qilib aylanardim.", type: "negative" },
      { key: "D", text: "Sayohatga chiqqandan ko‘ra uyda yolg‘iz yotib dam olganim yaxshi.", type: "negative" }
    ],
    positiveMessages: [
      "Ikkimiz — butun dunyo yetarli ❤️",
      "Qachon ketamiz?! 😍",
      ...POSITIVE_MESSAGES_FALLBACK.slice(0, 2)
    ],
    negativeMessages: NEGATIVE_MESSAGES_FALLBACK
  },
  {
    id: 5,
    question: "Men seni qanday sevishimni eng ko‘p yoqtirasan?",
    answers: [
      { key: "A", text: "Kutilmaganda kelib quchoqlashing va shirin gapirib, erkalanishlaringni.", type: "positive" },
      { key: "B", text: "Charchab kelganimda ko‘zlarimga qarab holimni tushunishing va men uchun duo qilishingni.", type: "positive" },
      { key: "C", text: "Menga umuman e’tibor bermay, o‘z holimga qo‘yib qo‘yishingni.", type: "negative" },
      { key: "D", text: "Har besh daqiqada \"Qayerdasiz? Kim bilansiz?\" deb tergov qilishingni.", type: "negative" }
    ],
    positiveMessages: [
      "Quchoqlashuvlarim eng shirini 🤗",
      "Sen uchun duo — mening vazifam ❤️",
      ...POSITIVE_MESSAGES_FALLBACK.slice(0, 2)
    ],
    negativeMessages: NEGATIVE_MESSAGES_FALLBACK
  },
  {
    id: 6,
    question: "Kelajakda birga qanday oila qurishni orzu qilasan?",
    answers: [
      { key: "A", text: "Uydan doim bolalar kulgisi, baxt sadosi va xotirjamlik arimaydigan fayzli oila.", type: "positive" },
      { key: "B", text: "Hamma havas qiladigan, bir-birini so‘zsiz tushunadigan namunali baxtli maskan.", type: "positive" },
      { key: "C", text: "Har kuni janjal bo‘ladigan, qo‘shnilar ham bezor bo‘ladigan shovqinli oila.", type: "negative" },
      { key: "D", text: "Er-xotin emas, shunchaki bitta uyda yashaydigan begona odamlardek bo‘lishni.", type: "negative" }
    ],
    positiveMessages: [
      "Fayzli oila — ortak orzumiz 🏡❤️",
      "Birga quramiz, albatta ✨",
      ...POSITIVE_MESSAGES_FALLBACK.slice(0, 2)
    ],
    negativeMessages: NEGATIVE_MESSAGES_FALLBACK
  },
  {
    id: 7,
    question: "Mening ovozimda aytgan qaysi so‘zim seni eng baxtli qiladi?",
    answers: [
      { key: "A", text: "\"Sizni juda yaxshi ko‘raman, boringizga shukr mardim.\"", type: "positive" },
      { key: "B", text: "\"Siz bilan faxrlanaman, doim sizga ishonaman va ortingizdaman.\"", type: "positive" },
      { key: "C", text: "\"Bugun ovqat qilmadim, ko‘chadan biron narsa olib kela qoling.\"", type: "negative" },
      { key: "D", text: "\"Oyingiznikiga ketyapman, bir hafta kelmayman.\"", type: "negative" }
    ],
    positiveMessages: [
      "Bu so‘zlar yuragimdan ❤️",
      "Sen mening faxrimsan ✨",
      ...POSITIVE_MESSAGES_FALLBACK.slice(0, 2)
    ],
    negativeMessages: NEGATIVE_MESSAGES_FALLBACK
  },
  {
    id: 8,
    question: "Agar men senga biror narsa sovg‘a qilsam, eng ko‘p xursand bo‘ladigan narsang nima bo‘lardi?",
    answers: [
      { key: "A", text: "Sening shirin tabassuming va baxtli ko‘zlaring — men uchun eng katta sovg‘a.", type: "positive" },
      { key: "B", text: "Qo‘llaring bilan men uchun tayyorlangan kichik bo‘lsa ham samimiy esdalik.", type: "positive" },
      { key: "C", text: "Hech narsa, baribir didingiz yo‘q, yoqimsiz narsalar sovg‘a qilasiz.", type: "negative" },
      { key: "D", text: "Eng qimmatbaho narsa bo‘lsa ham, baribir meni xursand qila olmaysiz.", type: "negative" }
    ],
    positiveMessages: [
      "Eng katta sovg‘am — sensan ❤️",
      "Samimiyat eng qimmatlisi ✨",
      ...POSITIVE_MESSAGES_FALLBACK.slice(0, 2)
    ],
    negativeMessages: NEGATIVE_MESSAGES_FALLBACK
  },
  {
    id: 9,
    question: "Bizning munosabatimizda eng qadrli narsa senga nima?",
    answers: [
      { key: "A", text: "Bir-birimizga bo‘lgan cheksiz ishonch, sadoqat va samimiylik.", type: "positive" },
      { key: "B", text: "Har qanday qiyinchilikda bir jamoa bo‘lib, birga kurasha olishimiz.", type: "positive" },
      { key: "C", text: "Faqat moddiy manfaatlar va pul (boshqa hech narsa bog‘lab turmaydi).", type: "negative" },
      { key: "D", text: "Oradagi soxtalik va bir-birimizga majburlikdan chidab yashashimiz.", type: "negative" }
    ],
    positiveMessages: [
      "Ishonch — bizning poydevorimiz ❤️",
      "Biz bir jamoamiz, abadiy 🤍",
      ...POSITIVE_MESSAGES_FALLBACK.slice(0, 2)
    ],
    negativeMessages: NEGATIVE_MESSAGES_FALLBACK
  },
  {
    id: 10,
    question: "Meni qachon eng ko‘p sog‘inasan?",
    answers: [
      { key: "A", text: "Har bir soniyada! Sen mening hayotimdagi eng yaqin va eng aziz insonimsan.", type: "positive" },
      { key: "B", text: "Yonimda bo‘lsang ham, senga qarab turib yana sog‘inaveraman.", type: "positive" },
      { key: "C", text: "Hech qachon sog‘inmayman, aksincha uydan ketsang dam olaman.", type: "negative" },
      { key: "D", text: "Faqat biron bir yumush buyurmoqchi bo‘lsam yoki pul kerak bo‘lsa eslayman.", type: "negative" }
    ],
    positiveMessages: [
      "Men ham har soniyada 🥺❤️",
      "Sog‘inishimiz cheksiz... 💫",
      ...POSITIVE_MESSAGES_FALLBACK.slice(0, 2)
    ],
    negativeMessages: NEGATIVE_MESSAGES_FALLBACK
  },

  /* ═════════════════════════════════════════════════════════════
     ⚠️ SAVOL 11 — PLACEHOLDER ⚠️
     Bu yerga foydalanuvchi keyinchalik aniq savol va A/B/C/D
     variantlarini beradi. O‘ZIMIZ hech qanday matn ixtiro qilmaymiz.
     Faqat shu placeholder obyektini to‘ldirish kifoya.
     ═════════════════════════════════════════════════════════════ */
  {
    id: 11,
    isPlaceholder: true,
    question: "[11-SAVOL JOYI — matn keyinchalik qo‘shiladi]",
    answers: [
      { key: "A", text: "[A varianti matni]", type: "positive" },
      { key: "B", text: "[B varianti matni]", type: "positive" },
      { key: "C", text: "[C varianti matni]", type: "negative" },
      { key: "D", text: "[D varianti matni]", type: "negative" }
    ],
    positiveMessages: POSITIVE_MESSAGES_FALLBACK,
    negativeMessages: NEGATIVE_MESSAGES_FALLBACK
  }
];
