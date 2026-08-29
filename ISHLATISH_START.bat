@echo off
chcp 65001 > NUL
title Korzinka ERP CRM - Ishga tushirish

echo ========================================================
echo   🧺 KORZINKA ERP CRM TIZIMI ISHGA TUSHMOQDA...
echo ========================================================
echo.

if not exist node_modules (
    echo ⚠️ 'node_modules' papkasi topilmadi. Avval o'rnatish bajarilmoqda...
    call npm install
)

echo ⚡ Tizim yaratilmoqda va ishga tushirilmoqda...
start "" "http://localhost:3000"
npm run dev

pause
