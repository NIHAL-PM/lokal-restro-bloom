@echo off
setlocal enabledelayedexpansion

title LokalRestro - Restaurant Management System Installer

echo ================================================================
echo  LokalRestro - Complete Restaurant Management System
echo  Windows Installation and Setup Wizard
echo ================================================================
echo.
echo This installer will:
echo  - Check system requirements
echo  - Install Node.js dependencies
echo  - Configure the system for your network
echo  - Set up Windows services
echo  - Create desktop shortcuts
echo  - Configure firewall rules
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ================================================================
    echo  ADMINISTRATOR PRIVILEGES REQUIRED
    echo ================================================================
    echo This installer needs to be run as Administrator to:
    echo  - Configure Windows Firewall
    echo  - Install Windows Services
    echo  - Create system-wide shortcuts
    echo.
    echo Please right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [1/8] Checking system requirements...
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed
    echo.
    echo Please install Node.js 18.0 or higher from:
    echo https://nodejs.org/
    echo.
    echo After installing Node.js, run this installer again.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✓ Node.js found: !NODE_VERSION!
)

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm is not found
    echo Please reinstall Node.js which includes npm
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✓ npm found: !NPM_VERSION!
)

echo.
echo [2/8] Setting up installation directory...

REM Get current directory
set INSTALL_DIR=%~dp0
set INSTALL_DIR=%INSTALL_DIR:~0,-1%

echo Installing to: %INSTALL_DIR%
echo.

echo [3/8] Installing dependencies...
echo.

echo Installing frontend dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo Installing server dependencies...
cd server
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install server dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo [4/8] Building application...
echo.

echo Building frontend for production...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to build frontend
    pause
    exit /b 1
)

echo.
echo [5/8] Network configuration...
echo.

REM Get IP address
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%i
    set IP=!IP: =!
    goto :ip_found
)
:ip_found

echo Your computer's IP address: %IP%
echo.
echo This IP will be used for mobile devices to connect to the system.
echo Make sure all devices (tablets, phones, PCs) are on the same network.
echo.

echo [6/8] Configuring Windows Firewall...
echo.

echo Adding firewall rules for LokalRestro...
netsh advfirewall firewall delete rule name="LokalRestro API" >nul 2>&1
netsh advfirewall firewall delete rule name="LokalRestro Sync" >nul 2>&1

netsh advfirewall firewall add rule name="LokalRestro API" dir=in action=allow protocol=TCP localport=4000
if %ERRORLEVEL% equ 0 (
    echo ✓ Added firewall rule for API server (port 4000)
) else (
    echo ⚠ Warning: Could not add firewall rule for port 4000
)

netsh advfirewall firewall add rule name="LokalRestro Sync" dir=in action=allow protocol=TCP localport=8765
if %ERRORLEVEL% equ 0 (
    echo ✓ Added firewall rule for sync server (port 8765)
) else (
    echo ⚠ Warning: Could not add firewall rule for port 8765
)

echo.
echo [7/8] Creating configuration files...

REM Create environment file if it doesn't exist
if not exist "server\.env" (
    echo Creating server configuration...
    copy "server\.env.example" "server\.env" >nul
    
    REM Update the .env file with the detected IP
    powershell -Command "(gc server\.env) -replace 'PRINTER_IP=192.168.1.100', 'PRINTER_IP=%IP%' | Out-File -encoding ASCII server\.env"
)

REM Create startup batch file
echo Creating startup script...
(
echo @echo off
echo title LokalRestro Restaurant Management System
echo cd /d "%INSTALL_DIR%"
echo echo Starting LokalRestro...
echo echo.
echo echo Access the system at:
echo echo  Local:   http://localhost:4000
echo echo  Network: http://%IP%:4000
echo echo.
echo echo For mobile devices, use: http://%IP%:4000
echo echo.
echo cd server
echo node index.js
) > "start-lokal-restro.bat"

REM Create service installation script
echo Creating service installer...
(
echo @echo off
echo title Install LokalRestro Windows Service
echo.
echo Installing LokalRestro as a Windows Service...
echo.
echo npm install -g node-windows
echo.
echo node -e "const Service = require('node-windows').Service; const svc = new Service({ name: 'LokalRestro', description: 'LokalRestro Restaurant Management System', script: '%INSTALL_DIR%\\server\\index.js' }); svc.on('install', function(){ console.log('Service installed successfully!'); svc.start(); }); svc.install();"
echo.
echo pause
) > "install-service.bat"

REM Create desktop shortcut
echo Creating desktop shortcuts...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\LokalRestro.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\start-lokal-restro.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\server\favicon.ico'; $Shortcut.Description = 'LokalRestro Restaurant Management System'; $Shortcut.Save()"

REM Create start menu shortcut
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\LokalRestro" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\LokalRestro"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\LokalRestro\LokalRestro.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\start-lokal-restro.bat'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'LokalRestro Restaurant Management System'; $Shortcut.Save()"

echo.
echo [8/8] Final setup and testing...
echo.

echo Testing database connection...
cd server
node -e "import('./services/dbService.js').then(() => console.log('✓ Database connection successful')).catch(e => {console.error('✗ Database error:', e.message); process.exit(1)})"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Database setup failed
    pause
    exit /b 1
)
cd ..

echo.
echo ================================================================
echo  INSTALLATION COMPLETED SUCCESSFULLY!
echo ================================================================
echo.
echo LokalRestro has been installed and configured.
echo.
echo QUICK START:
echo  1. Double-click the "LokalRestro" shortcut on your desktop
echo  2. Wait for the server to start (you'll see startup messages)
echo  3. Open a web browser and go to: http://localhost:4000
echo.
echo MOBILE ACCESS:
echo  On tablets/phones connected to the same WiFi:
echo  Go to: http://%IP%:4000
echo.
echo DEFAULT LOGIN CREDENTIALS:
echo  Admin:    PIN 1234
echo  Waiter:   PIN 2222  
echo  Chef:     PIN 3333
echo  Cashier:  PIN 4444
echo.
echo IMPORTANT NOTES:
echo  - Make sure all devices are on the same WiFi network
echo  - The first time you access the system, set up your restaurant details
echo  - Configure printer settings in Admin → Settings → Printer
echo  - For printer setup, you'll need the printer's IP address
echo.
echo OPTIONAL - WINDOWS SERVICE:
echo  To run LokalRestro automatically when Windows starts:
echo  1. Run "install-service.bat" as Administrator
echo  2. The service will start automatically on system boot
echo.
echo SUPPORT:
echo  - Documentation: See README.md and WINDOWS_DEPLOYMENT.md
echo  - Log files: server\logs\
echo  - Configuration: server\.env
echo.
echo Would you like to start LokalRestro now? (Y/N)
set /p START_NOW=
if /i "%START_NOW%"=="Y" (
    echo.
    echo Starting LokalRestro...
    start "" "%INSTALL_DIR%\start-lokal-restro.bat"
    echo.
    echo LokalRestro is starting...
    echo Check the new window for startup progress.
    timeout /t 5 /nobreak >nul
    echo.
    echo Opening web browser...
    start "" http://localhost:4000
)

echo.
echo Installation complete! Press any key to exit.
pause >nul