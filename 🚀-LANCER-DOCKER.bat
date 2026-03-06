@echo off
chcp 65001 >nul
title QuranReview - Docker Launcher

:: Vérifier si PowerShell est disponible
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PowerShell n'est pas disponible
    pause
    exit /b 1
)

:: Lancer le script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0start-docker.ps1"

pause
