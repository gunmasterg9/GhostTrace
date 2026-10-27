@echo off
title GhostTrace AI - Startup
cd /d "%~dp0"

echo ===================================================
echo   GhostTrace AI - The Ghost That Remembers
echo ===================================================
echo.

:: Check if port 5173 is already running
netstat -ano | findstr :5173 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [!] GhostTrace is already running on port 5173.
    echo Opening browser at http://localhost:5173...
    start http://localhost:5173
    pause
    exit /b
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo [*] node_modules not found. Installing dependencies...
    call npm install
)

echo [*] Starting GhostTrace AI development server...
echo [*] Opening browser at http://localhost:5173 ...
echo.

:: Launch browser in background once server is ready
start "" cmd /c "ping 127.0.0.1 -n 3 >nul & start http://localhost:5173"

:: Run Vite dev server
call npm run dev
