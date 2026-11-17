@echo off
chcp 65001 > NUL
title Korzinka ERP CRM - Tarmoqqa ochish va avtomatik ishga tushirish
cd /d "%~dp0"

net session > NUL 2>&1
if errorlevel 1 (
    echo [XATO] Bu faylni o'ng tugma bilan bosib,
    echo "Administrator sifatida ishga tushirish" ni tanlang.
    pause
    exit /b 1
)

echo [1/3] Windows Firewall da 3000-port ochilmoqda...
netsh advfirewall firewall delete rule name="Korzinka ERP" > NUL 2>&1
netsh advfirewall firewall add rule name="Korzinka ERP" dir=in action=allow protocol=TCP localport=3000 profile=private,domain > NUL
if errorlevel 1 (echo     [XATO] Port ochilmadi.) else (echo     Tayyor.)

echo [2/3] Kompyuter yoqilganda dastur o'zi ishga tushadigan qilinmoqda...
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\KorzinkaERP.bat"
> "%STARTUP%" echo @echo off
>> "%STARTUP%" echo start "Korzinka ERP" /min cmd /c ""%~dp0ISHLATISH_START.bat" auto"
if exist "%STARTUP%" (echo     Tayyor.) else (echo     [XATO] Yozib bo'lmadi.)

echo [3/3] Har kuni soat 19:00 da avtomatik zaxira nusxa sozlanmoqda...
schtasks /create /f /sc daily /st 19:00 /tn "Korzinka ERP Backup" /tr "\"%~dp0BAZANI_BACKUP_QILISH.bat\" auto" > NUL
if errorlevel 1 (echo     [XATO] Vazifa yaratilmadi.) else (echo     Tayyor.)

echo.
echo ========================================================
echo   Tayyor. Telefonlardan kirish manzili:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do for /f "tokens=*" %%b in ("%%a") do echo     http://%%b:3000
echo.
echo   Eslatma: Wi-Fi tarmog'i Windows da "Private (Xususiy)" deb
echo   belgilangan bo'lishi kerak, aks holda telefonlar ulana olmaydi.
echo ========================================================
pause
