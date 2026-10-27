@echo off
title GhostTrace AI - Stop
cd /d "%~dp0"

echo ===================================================
echo   Stopping GhostTrace AI Server...
echo ===================================================
echo.

setlocal enabledelayedexpansion
set "FOUND=0"

:: Find process PID listening on port 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    set "PID=%%a"
    if defined PID (
        set "FOUND=1"
        echo [*] Terminating GhostTrace process on PID !PID!...
        taskkill /F /PID !PID! >nul 2>&1
    )
)

if "!FOUND!"=="1" (
    echo.
    echo [OK] GhostTrace server on port 5173 has been stopped.
) else (
    echo [!] No active GhostTrace process found listening on port 5173.
)

echo.
ping 127.0.0.1 -n 3 >nul
