@echo off
chcp 65001 > NUL
title Korzinka ERP CRM - Bazani Tiklash (Restore)

echo ========================================================
echo   📥 'database_backup.json' FAYLIDAN BAZANI TIKLASH
echo ========================================================
echo.

call node scripts/restore_full_database.js

echo.
echo ========================================================
echo ✅ Baza muvaffaqiyatli tiklandi!
echo ========================================================
echo.
pause
