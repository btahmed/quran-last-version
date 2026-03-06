@echo off
chcp 65001 >nul
echo ============================================
echo   🐳 QuranReview - Docker Setup
echo ============================================
echo.

REM Copier les fichiers frontend
echo 📁 Copie des fichiers frontend...
if not exist "frontend\index.html" (
    copy index.html frontend\
    echo   ✓ index.html copié
)
if not exist "frontend\style-pro.css" (
    copy style-pro.css frontend\
    echo   ✓ style-pro.css copié
)
if not exist "frontend\script.js" (
    copy script.js frontend\
    echo   ✓ script.js copié
)
if exist "style.css" (
    if not exist "frontend\style.css" (
        copy style.css frontend\
        echo   ✓ style.css copié
    )
)
if exist "manifest.json" (
    if not exist "frontend\manifest.json" (
        copy manifest.json frontend\
        echo   ✓ manifest.json copié
    )
)
if exist "assets" (
    xcopy /E /I /Y assets frontend\assets >nul 2>&1
    echo   ✓ Dossier assets copié
)
if exist "images" (
    xcopy /E /I /Y images frontend\images >nul 2>&1
    echo   ✓ Dossier images copié
)

echo.
echo ============================================
echo   ✅ Fichiers préparés !
echo ============================================
echo.
echo 📋 Prochaines étapes :
echo.
echo 1️⃣  Placez votre backend Django dans le dossier 'backend/'
echo    - manage.py doit être à la racine de backend/
echo    - Créez backend/requirements.txt
echo.
echo 2️⃣  Lancez Docker Desktop
echo.
echo 3️⃣  Exécutez cette commande dans PowerShell :
echo    docker-compose up --build
echo.
echo 4️⃣  Accédez à :
echo    Frontend : http://localhost
echo    Backend  : http://localhost:8000
echo.
echo ============================================
pause
