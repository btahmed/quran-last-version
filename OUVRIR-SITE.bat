@echo off
echo ========================================
echo   OUVERTURE DU SITE QURANREVIEW
echo ========================================
echo.
echo Le site va s'ouvrir dans votre navigateur...
echo.

REM Ouvrir le fichier HTML dans le navigateur par défaut
start "" "%~dp0index.html"

echo.
echo Site ouvert!
echo.
echo IMPORTANT:
echo - Le backend Django doit etre en cours d'execution sur le port 8000
echo - Identifiants admin: administrateur / admin123
echo.
pause
