@echo off
chcp 65001 >nul
title QuranReview - Docker Simple

echo ==========================================
echo    QuranReview - Docker Simple
echo ==========================================
echo.

:: Verifier Docker
echo Verification de Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo Docker n'est pas installe ou pas demarre !
    echo.
    echo 1. Installez Docker Desktop :
    echo    https://www.docker.com/products/docker-desktop
    echo.
    echo 2. Lancez Docker Desktop
    echo.
    pause
    exit /b 1
)

echo Docker OK
echo.

:: Preparer les fichiers
echo Preparation des fichiers...
if not exist "frontend" mkdir frontend
copy /Y index.html frontend\ >nul
copy /Y style-pro.css frontend\ >nul
copy /Y script.js frontend\ >nul
copy /Y style.css frontend\ >nul 2>&1
copy /Y manifest.json frontend\ >nul 2>&1
if exist "assets" xcopy /E /I /Y assets frontend\assets >nul 2>&1
if exist "images" xcopy /E /I /Y images frontend\images >nul 2>&1
echo Fichiers prets
echo.

:: Lancer Docker
echo Lancement de l'application...
echo Cela peut prendre quelques minutes...
echo.

docker-compose down >nul 2>&1
docker-compose up --build -d

if errorlevel 1 (
    echo.
    echo ERREUR lors du demarrage !
    echo.
    echo Essayez cette commande :
    echo    docker-compose up --build
    echo.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo    Application demarree !
echo ==========================================
echo.
echo Frontend : http://localhost
echo Backend  : http://localhost:8000
echo.
echo Appuyez sur une touche pour ouvrir le navigateur...
pause >nul

start http://localhost
