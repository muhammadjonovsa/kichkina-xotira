# Bu hikoya faqat sen uchun ❤️

Romantik, bir martalik interaktiv web-tajriba: kamera xotirasi, 11 ta savol,
qochib yuruvchi salbiy javoblar, sovg‘a qutisi va yurak shaklidagi surat.

> **Maxfiylik:** Kamera surati hech qachon serverga yuklanmaydi. U faqat
> foydalanuvchi brauzerida (IndexedDB / localStorage) saqlanadi va faqat
> foydalanuvchi o‘zi "Menga sovg‘a yuborish" tugmasini bosganda ulashiladi.

---

## Loyiha strukturasi (web sayt)

```
future_wife/
├── index.html          # Sahifa strukturasi (barcha ekranlar)
├── style.css           # Dizayn, animatsiyalar, responsive, reduced-motion
├── js/
│   ├── questions.js    # 11 ta savol (11-savol placeholder!)
│   ├── app.js          # State machine, kamera, sovg‘a, ulashish, lock
│   └── particles.js    # Canvas particle engine (bokeh, yuraklar, burst)
├── audio/
│   ├── README.md       # Musiqani qanday qo'shish
│   └── romantic.mp3    # (ixtiyoriy — bo'lmasa sayt o'zi yumshoq musiqa chizadi)
└── .github/workflows/deploy.yml   # GitHub Pages avtomatik deploy
```

*(Katalogdagi `android/`, `ios/`, `lib/` va boshqa papkalar Flutter loyihasi —
web-sayt uchun kerak emas, GitHub Pages faqat root'dagi HTML/CSS/JS ni ishlatadi.)*

---

## 🚀 GitHub Pages orqali deploy

### 1. GitHub repository yaratish
1. [github.com](https://github.com) → **New repository**
2. Nomi: masalan `future-wife` (**Private** tavsiya etiladi)
3. **Create repository**

### 2. Push qilish
```bash
cd c:\Users\saydu\StudioProjects\future_wife
git init
git add .
git commit -m "Romantik sevgi sayti"
git branch -M main
git remote add origin https://github.com/SIZNING_USERNAME/future-wife.git
git push -u origin main
```

### 3. Pages yoqish
1. Repository → **Settings** → **Pages**
2. **Source**: `GitHub Actions` tanlang
3. Shundan so‘ng `.github/workflows/deploy.yml` avtomatik ishlaydi
   (`main` ga har push da qayta deploy bo'ladi)

### 4. Sayt manzili
Deploy tugagach (1–2 daqiqa):

```
https://SIZNING_USERNAME.github.io/future-wife/
```

Bu havola HTTPS — kamera, Web Share API va localStorage uchun shart!

---

## 🌐 Custom domain ulash (ixtiyoriy)

1. Repository → **Settings** → **Pages** → **Custom domain** maydoniga
   domen yozing (masalan `love.example.com`) va **Add**.
2. Repo ildizida `CNAME` fayl paydo bo'ladi (yoki o'zingiz yarating,
   ichida faqat domen yozilgan bo'lsin) — commit qilib push qiling.
3. DNS provayderingizda quyidagini qo'shing:

   **Subdomain uchun (love.example.com):**
   ```
   Type: CNAME
   Name: love
   Value: SIZNING_USERNAME.github.io.
   ```

   **Apex domen uchun (example.com):** A yozuvlari:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
   (IPv6 uchun AAAA: `2606:50c0:8000::153` … `8003::153`)
4. DNS tarqalgach (5–30 daq) Settings → Pages → **Enforce HTTPS** ni yoqing.

---

## ✍️ 11-savolni to‘ldirish

`js/questions.js` faylining oxirida aniq belgilangan placeholder bor:

```js
/* ⚠️ SAVOL 11 — PLACEHOLDER ⚠️ */
{
  id: 11,
  question: "[11-SAVOL JOYI — matn keyinchalik qo‘shiladi]",
  ...
}
```

Faqat shu obyekt ichidagi matnlarni almashtiring — kodga tegish shart emas.

## 🎵 Musiqa

`audio/README.md` ga qarang. Fayl bo‘lmasa ham sayt uzilmaydi —
brauzer Web Audio API bilan yumshoq romantik fon chizadi.

## 🔧 Test uchun reset

Brauzer konsolida:
```js
__fwReset()
```
Lock, surat va sessiya tozalangan holda sayt qaytadan ochiladi.

## ✅ Deploydan keyin test ro‘yxati

- [ ] Sayt HTTPS'da ochilyapti
- [ ] "Boshlash" bosilguncha kamera so‘ralmaydi
- [ ] Kamera ruxsati → surat → stream darhol o‘chadi
- [ ] Ruxsat berilmasa hikoya davom etadi
- [ ] C/D bosilsa savol oldinga siljimaydi, javob "qochadi"
- [ ] A/B bosilsa yurak partlashuvi va keyingi savol
- [ ] Sovg‘a ochilishi + yurakdagi surat
- [ ] Share tugmasi (telefonda native menyu)
- [ ] Yangilanganda: "Bu sayt eskirdi... ❤️"
