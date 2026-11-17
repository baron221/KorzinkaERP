@echo off
chcp 65001 > NUL
title Korzinka ERP CRM - O'rnatish va Sozlash
cd /d "%~dp0"

echo ========================================================
echo   KORZINKA ERP CRM - DASTURNI SHU KOMPYUTERGA O'RNATISH
echo   (internetsiz ishlaydigan lokal server)
echo ========================================================
echo.

where node > NUL 2>&1
if errorlevel 1 (
    echo [XATO] Node.js topilmadi. Avval https://nodejs.org saytidan LTS versiyasini o'rnating.
    pause
    exit /b 1
)

if not exist database_backup.json (
    echo [XATO] 'database_backup.json' fayli topilmadi. Bazani tiklab bo'lmaydi.
    pause
    exit /b 1
)

echo PostgreSQL shu kompyuterga o'rnatilgan bo'lishi kerak.
echo O'rnatishda 'postgres' foydalanuvchisiga qo'ygan parolingizni kiriting
echo (parolda faqat harf va raqam bo'lsin):
set /p PGPASS=Parol:
if "%PGPASS%"=="" (
    echo [XATO] Parol kiritilmadi.
    pause
    exit /b 1
)

rem Bulutdagi baza sozlamasini saqlab qo'yamiz va lokal bazaga o'tamiz
if exist .env if not exist .env.bulut.bak copy /y .env .env.bulut.bak > NUL
> .env echo DATABASE_URL="postgresql://postgres:%PGPASS%@localhost:5432/korzinka?schema=public"

echo.
echo [1/5] Kerakli kutubxonalar o'rnatilmoqda (internet kerak)...
call npm install
if errorlevel 1 goto :xato

echo.
echo [2/5] Lokal baza yaratilmoqda...
call npx prisma db push
if errorlevel 1 (
    echo.
    echo [XATO] Bazaga ulanib bo'lmadi. PostgreSQL ishlab turganini va parol to'g'riligini tekshiring.
    goto :xato
)

echo.
echo [3/5] Ma'lumotlar 'database_backup.json' dan tiklanmoqda...
call node scripts/restore_full_database.js
if errorlevel 1 goto :xato

echo.
echo [4/5] Direktor logini yaratilmoqda...
call node prisma/seed.js
if errorlevel 1 goto :xato

echo.
echo [5/5] Dastur tayyorlanmoqda (build), bir necha daqiqa kuting...
call npm run build
if errorlevel 1 goto :xato

echo.
echo ========================================================
echo   O'RNATISH MUVAFFAQIYATLI YAKUNLANDI!
echo   Endi 'ISHLATISH_START.bat' ni bosib dasturni ishga tushiring.
echo   Telefonlardan kirish uchun 'TARMOQQA_OCHISH.bat' ni
echo   o'ng tugma - "Administrator sifatida ishga tushirish" bilan bir marta bosing.
echo ========================================================
echo.
pause
exit /b 0

:xato
echo.
echo ========================================================
echo   [XATO] O'rnatish to'xtadi. Yuqoridagi xabarni o'qing.
echo ========================================================
pause
exit /b 1
