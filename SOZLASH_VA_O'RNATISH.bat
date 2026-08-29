@echo off
chcp 65001 > NUL
title Korzinka ERP CRM - O'rnatish va Sozlash

echo ========================================================
echo   🧺 KORZINKA ERP CRM - DASTURNI YANGI KOMPYUTERGA O'RNATISH
echo ========================================================
echo.

echo 📦 1. Kerakli kutubxonalar (node_modules) o'rnatilmoqda...
call npm install

echo 🔄 2. Prisma bazasi hosil qilinmoqda...
call npx prisma db push

echo 📥 3. Bazadagi ma'lumotlar qayta tiklanmoqda...
call node scripts/restore_full_database.js

echo.
echo ========================================================
echo 🎉 O'RNATISH MUVAFFAQIYATLI YAKUNLANDI!
echo Endi 'ISHLATISH_START.bat' faylini bosib dasturni ishlatishingiz mumkin.
echo ========================================================
echo.
pause
