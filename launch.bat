@echo off
title Rotary Encoder Display

:: Change to the directory where this batch file resides
cd /d "%~dp0"

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found in PATH. Please install Python or add it to your PATH.
    pause
    exit /b 1
)

:: Run the main script
echo Launching main.py ...
python main.py

:: If the script exits, keep the window open to see any errors
pause