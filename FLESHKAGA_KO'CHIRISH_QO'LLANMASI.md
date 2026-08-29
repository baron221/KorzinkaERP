# 🧺 Korzinka ERP CRM — Fleshkaga Ko'chirish va Tizimni Egasiga Topshirish Qo'llanmasi

Ushbu loyiha, uning barcha kodlari hamda ma'lumotlar bazasidagi **barcha mavjud yozuvlar** (mijozlar, savdolar, to'lovlar, xomashyo, ishlab chiqarish, xarajatlar va tarix) to'liq zaxiralanib, fleshkaga ko'chirish va yangi kompyuterda ishlatish uchun tayyorlandi.

---

## 📁 1. Fleshkaga qaysi fayllarni ko'chirish kerak?

Fleshkaga ko'chirish tezroq va hajmi kichik (xavfsiz) bo'lishi uchun **butun loyiha papkasini (`CRM`)** ko'chirasiz, **faqat quyidagi 2 ta og'ir papkani tashlab o'tsangiz bo'ladi**:
- `node_modules` (buni yangi kompyuterda avtomatik o'zi tiklaydi)
- `.next` (vaqtincha kesh papkasi)

### Fleshkaga tushishi shart bo'lgan eng muhim fayllar:
- 📄 **`database_backup.json`** — Loyihadagi barcha 395 ta savdo, 55 ta mijoz, 125 ta ishlab chiqarish partiyasi, 178 ta to'lov, 21 ta vozvrat va barcha tarixiy ma'lumotlarning **asosiy zaxirasi (backup)**.
- 🚀 **`ISHLATISH_START.bat`** — Yangi kompyuterda dasturni 1 marta bosish bilan ishga tushirish tugmasi.
- ⚙️ **`SOZLASH_VA_O'RNATISH.bat`** — Yangi kompyuterda dasturni ilk bor tayyorlash va bazani tiklash tugmasi.
- 💾 **`BAZANI_BACKUP_QILISH.bat`** — Istalgan vaqtda bazani JSON zaxiraga oluvchi tugma.
- 📥 **`BAZANI_TIKLASH.bat`** — Zaxiradagi ma'lumotlarni bazaga qayta yuklovchi tugma.
- 🔑 **`.env`** — Ma'lumotlar bazasi ulanish kalitlari.
- 📁 **`src/`**, **`prisma/`**, **`scripts/`**, **`package.json`** — Dasturning to'liq manba kodlari.

---

## 💻 2. Tizim egasining kompyuterida ishga tushirish tartibi:

Loyiha egasi o'z kompyuterida dasturni ishlatishi uchun **atigi 3 ta oddiy qadam** bajariladi:

### 1-qadam: Node.js ni o'rnatish (agar o'rnatilmagan bo'lsa)
Kompyuterda Node.js dasturi bo'lishi kerak. 
* Yuklab olish havolasi: [https://nodejs.org](https://nodejs.org) (LTS versiyasini yuklab o'rnatish kifoya).

### 2-qadam: Dasturni o'rnatish (Birinchi marta)
Fleshkadagi `CRM` papkasini kompyuterga ko'chirib o'tkazgach, papka ichidagi:
👉 **`SOZLASH_VA_O'RNATISH.bat`** faylini sichqoncha bilan 2 marta bosing.
* U avtomatik ravishda kutubxonalarni o'rnatadi va bazadagi barcha ma'lumotlarni tiklaydi.

### 3-qadam: Dasturni ishlatish
Har safar CRM dasturini ochish uchun:
👉 **`ISHLATISH_START.bat`** faylini bosing.
* Dastur avtomatik ravishda brauzerda (`http://localhost:3000`) ochiladi.

---

## 📊 3. Zaxiralangan ma'lumotlar hajmi:
Quyidagi barcha ma'lumotlar `database_backup.json` fayliga to'liq saqlandi:
- 👥 **Mijozlar**: 55 ta
- 🛒 **Savdolar**: 395 ta
- 💳 **Mijozlar to'lovlari**: 178 ta
- ↩️ **Vozvratlar**: 21 ta
- 🏭 **Ishlab chiqarish partiyalari**: 125 ta (125 xil mahsulot)
- 🚛 **Ta'minotchilar va Seryo kirimlari**: 7 ta ta'minotchi, 45 ta seryo kirimi, 30 ta to'lov
- 💸 **Xarajatlar**: 46 ta
- 📋 **Audit jurnali (Tarix)**: 900 ta yozuv

---

## 🔒 Xavfsizlik va topshirish
Ushbu zaxira va loyiha kodi to'liq loyiha egasiga topshirilishi uchun tayyor. Fleshkaga ko me'yorda nusxalanib topshirilishi mumkin.
