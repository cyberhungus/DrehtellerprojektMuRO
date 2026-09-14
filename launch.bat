@echo off
title DO-Exponat-Software

:: Change to the directory where this batch file resides
cd /d "%~dp0"

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found in PATH. Please install Python or add it to your PATH.
    pause
    exit /b 1
)

:: Kill any running instance of app.py
echo Checking for running instances of app.py ...
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='python.exe' OR Name='pythonw.exe'\" | Where-Object { $_.CommandLine -like '*app.py*' } | ForEach-Object { Write-Host ('Stopping PID ' + $_.ProcessId); Stop-Process -Id $_.ProcessId -Force }"

:: Kill any running Chrome instances
echo Closing Chrome ...
taskkill /IM chrome.exe /F >nul 2>&1
taskkill /IM chrome_proxy.exe /F >nul 2>&1

:: Give the OS a moment to release the port / file handles
timeout /t 2 /nobreak >nul

:: Run the main script in final mode
echo Launching app.py --final ...
python app.py --final

:: If the script exits, keep the window open to see any errors
pause