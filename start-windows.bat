@echo off
title LokalRestro Restaurant Management System

echo ========================================
echo  LokalRestro - Starting Restaurant System
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Get current directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo [1/5] Checking dependencies...
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

if not exist "server\node_modules" (
    echo Installing server dependencies...
    cd server
    call npm install
    cd ..
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install server dependencies
        pause
        exit /b 1
    )
)

echo [2/5] Building frontend...
if not exist "dist" (
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to build frontend
        pause
        exit /b 1
    )
)

echo [3/5] Checking server configuration...
if not exist "server\.env" (
    echo Creating default configuration...
    copy "server\.env.example" "server\.env" >nul 2>nul
    echo Please edit server\.env with your configuration
)

echo [4/5] Testing database connection...
cd server
node -e "import('./services/dbService.js').then(() => console.log('Database OK')).catch(e => {console.error('Database Error:', e.message); process.exit(1)})"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Database connection failed
    pause
    exit /b 1
)

echo [5/5] Starting services...
echo.
echo Starting WebSocket Sync Server (Port 8765)...
echo Starting HTTP API Server (Port 4000)...
echo.
echo ========================================
echo  LokalRestro is now running!
echo ========================================
echo.
echo Access the application at:
echo  - Local:    http://localhost:4000
echo  - Network:  http://%COMPUTERNAME%:4000
echo.
echo For mobile/tablet access, use your IP address:
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do set IP=%%i
set IP=%IP: =%
echo  - Mobile:   http://%IP%:4000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the server
node index.js

cd ..
pause