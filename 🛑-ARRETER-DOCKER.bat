@echo off
chcp 65001 >nul
title QuranReview - Arrêter Docker

echo ==========================================
echo    🛑 Arrêt de QuranReview
echo ==========================================
echo.

cd /d "%~dp0"

echo ⏳ Arrêt des conteneurs...
docker-compose down

if %errorlevel% equ 0 (
    echo.
    echo ✅ Application arrêtée avec succès !
) else (
    echo.
    echo ⚠️  Une erreur s'est produite
)

echo.
pause
