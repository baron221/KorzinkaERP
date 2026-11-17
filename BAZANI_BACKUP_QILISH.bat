@echo off
chcp 65001 > NUL
title Korzinka ERP CRM - Bazani Zaxiralash (Backup)
cd /d "%~dp0"

echo ========================================================
echo   BAZADAGI MA'LUMOTLARNI BACKUP QILISH (EKSPORT)
echo ========================================================
echo.

call node scripts/export_full_database.js
if errorlevel 1 (
    echo.
    echo [XATO] Zaxira olinmadi. Yuqoridagi xabarni o'qing.
    if /i not "%~1"=="auto" pause
    exit /b 1
)

echo.
echo ========================================================
echo   Baza 'database_backup.json' fayliga va 'backups' papkasiga saqlandi.
echo   'backups' papkasini vaqti-vaqti bilan fleshkaga ko'chirib turing.
echo ========================================================
echo.
rem "auto" bilan chaqirilsa (rejalashtirilgan vazifa) oyna o'zi yopiladi
if /i not "%~1"=="auto" pause
