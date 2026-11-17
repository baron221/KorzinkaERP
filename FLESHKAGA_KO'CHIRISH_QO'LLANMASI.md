# Korzinka ERP CRM — mijoz kompyuteriga o'rnatish qo'llanmasi

Bu qo'llanma dasturni mijozning kompyuteriga **lokal server** qilib o'rnatish uchun. O'rnatilgach dastur internetsiz ishlaydi: baza ham, dastur ham shu kompyuterda turadi, telefon va boshqa kompyuterlar unga shu binodagi Wi‑Fi orqali ulanadi.

Internet faqat o'rnatish kuni kerak (Node.js, PostgreSQL va kutubxonalarni yuklash uchun).

---

## 1. O'z kompyuteringizda: eng yangi ma'lumotni olish

Papkadagi `database_backup.json` eski bo'lishi mumkin. Ko'chirishdan oldin uni yangilang:

1. `BAZANI_BACKUP_QILISH.bat` ni bosing. U bulutdagi bazadan hamma ma'lumotni `database_backup.json` ga yozadi.
2. Shu daqiqadan boshlab saytga (Vercel) yangi ma'lumot kiritilmasin — aks holda u lokal bazaga o'tmay qoladi.

## 2. Fleshkaga ko'chirish

Butun `CRM` papkasini ko'chiring. Quyidagi ikki papkani tashlab ketish mumkin (ular katta va yangi kompyuterda o'zi qayta yaratiladi):

- `node_modules`
- `.next`

## 3. Mijoz kompyuterida: bir martalik o'rnatish

1. **Node.js** ni o'rnating: <https://nodejs.org> (LTS versiya).
2. **PostgreSQL** ni o'rnating: <https://www.postgresql.org/download/windows/>
   - O'rnatish paytida `postgres` foydalanuvchisi uchun parol so'raladi. Faqat harf va raqamdan iborat parol qo'ying va yozib oling.
   - Port so'ralganda `5432` ni o'zgartirmang.
3. `CRM` papkasini fleshkadan kompyuterga ko'chiring (masalan `C:\CRM`).
4. `SOZLASH_VA_O'RNATISH.bat` ni bosing va PostgreSQL parolini kiriting. U:
   - dasturni lokal bazaga ulaydi (eski bulut sozlamasi `.env.bulut.bak` da saqlanadi),
   - bazani yaratadi va `database_backup.json` dagi ma'lumotni tiklaydi,
   - direktor loginini yaratadi (`admin` / `korzinka77`),
   - dasturni tayyorlaydi (build).
5. `TARMOQQA_OCHISH.bat` ni **o'ng tugma → "Administrator sifatida ishga tushirish"** bilan bosing. U:
   - telefonlar ulana olishi uchun Windows Firewall da 3000-portni ochadi,
   - kompyuter yoqilganda dastur o'zi ishga tushadigan qiladi,
   - har kuni soat 19:00 da avtomatik zaxira nusxa olishni sozlaydi.

## 4. Har kungi ishlatish

- **Server kompyuterda:** `ISHLATISH_START.bat` ni bosing (yoki kompyuter yoqilganda o'zi ishga tushadi). Ochilgan qora oynani yopmang — yopilsa dastur to'xtaydi.
- **Shu kompyuterda:** brauzerda `http://localhost:3000`.
- **Telefon va boshqa kompyuterlarda:** shu Wi‑Fi ga ulanib, qora oynada ko'rsatilgan manzilni oching (masalan `http://192.168.1.10:3000`).

### Telefonlar ulana olmasa

- Telefon va server kompyuter bitta Wi‑Fi da ekanini tekshiring.
- Windows da Wi‑Fi tarmog'i "Private (Xususiy)" deb belgilangan bo'lishi kerak.
- Server kompyuterning manzili o'zgarib qolgan bo'lishi mumkin. Routerda shu kompyuterga doimiy IP manzil biriktirib qo'ying.

## 5. Zaxira nusxa

Endi ma'lumot faqat shu kompyuterda turadi. Disk buzilsa va zaxira bo'lmasa, hammasi yo'qoladi.

- Zaxira har safar dastur ishga tushganda va har kuni 19:00 da avtomatik olinadi.
- Nusxalar `backups` papkasida sana bilan saqlanadi (oxirgi 30 kun).
- **`backups` papkasini kamida haftada bir marta fleshkaga yoki boshqa diskka ko'chirib turing.**
- Qo'lda zaxira olish: `BAZANI_BACKUP_QILISH.bat`.
- Zaxiradan tiklash: kerakli faylni `database_backup.json` nomi bilan `CRM` papkasiga qo'yib, `BAZANI_TIKLASH.bat` ni bosing. Tiklash faqat bo'sh bazaga to'g'ri ishlaydi; ichida ma'lumot bor bazaga tiklansa yozuvlar aralashib ketadi.

## 6. Dastur yangilanganda

Yangi kodni `CRM` papkasiga ko'chirgach, `.next` papkasini o'chirib, `ISHLATISH_START.bat` ni bosing — dastur o'zi qayta tayyorlanadi. `.env` va `backups` ga tegmang.
