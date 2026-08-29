@echo off
chcp 65001 > NUL
title Korzinka ERP CRM - Bazani Zaxiralash (Backup)

echo ========================================================
echo   💾 BAZADAGI MA'LUMOTLARNI BACKUP QILISH (EKSPORT)
echo ========================================================
echo.

call node scripts/export_full_database.js

echo.
echo ========================================================
echo ✅ Baza muvaffaqiyatli 'database_backup.json' fayliga saqlandi!
echo ========================================================
echo.
pause
