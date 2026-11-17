@echo off
chcp 65001 > NUL
title Korzinka ERP CRM - Server
cd /d "%~dp0"

echo ========================================================
echo   KORZINKA ERP CRM ISHGA TUSHMOQDA...
echo   Bu oynani yopmang: yopilsa dastur to'xtaydi.
echo ========================================================
echo.

if not exist node_modules (
    echo [XATO] Dastur hali o'rnatilmagan. Avval 'SOZLASH_VA_O'RNATISH.bat' ni ishga tushiring.
    pause
    exit /b 1
)

if not exist .next\BUILD_ID (
    echo Dastur tayyorlanmoqda, bir necha daqiqa kuting...
    call npm run build
    if errorlevel 1 (
        echo [XATO] Build bajarilmadi.
        pause
        exit /b 1
    )
)

echo Kunlik zaxira nusxa olinmoqda...
call node scripts/export_full_database.js > NUL 2>&1
if errorlevel 1 echo [OGOHLANTIRISH] Zaxira olinmadi. PostgreSQL ishlab turganini tekshiring.

echo.
echo Shu kompyuterda:      http://localhost:3000
echo Telefon va boshqa kompyuterlardan (shu Wi-Fi da):
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do for /f "tokens=*" %%b in ("%%a") do echo     http://%%b:3000
echo.

rem "auto" bilan chaqirilsa (kompyuter yoqilganda) brauzer ochilmaydi
if /i not "%~1"=="auto" start "" cmd /c "timeout /t 6 > NUL & start http://localhost:3000"

call npx next start -H 0.0.0.0 -p 3000

pause
