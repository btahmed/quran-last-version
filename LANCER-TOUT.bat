@echo off
chcp 65001 >nul
echo ============================================
echo    QURANREVIEW - LANCEMENT COMPLET
echo ============================================
echo.

:: Kill existing processes
echo [1/4] Nettoyage des ports...
taskkill /F /IM python.exe /IM pythonw.exe 2>nul
timeout /t 2 /nobreak >nul
echo    OK

:: Start Backend
echo.
echo [2/4] Demarrage Backend Django...
cd /d C:\dev\QuranReview\backend
start "QuranReview Backend" cmd /c "venv\Scripts\python manage.py runserver 127.0.0.1:8000"
timeout /t 4 /nobreak >nul
echo    OK

:: Start Frontend
echo.
echo [3/4] Demarrage Frontend...
cd /d C:\dev\QuranReview
start "QuranReview Frontend" cmd /c "python -m http.server 8080"
timeout /t 2 /nobreak >nul
echo    OK

:: Open browser
echo.
echo [4/4] Ouverture du navigateur...
timeout /t 2 /nobreak >nul
start http://localhost:8080
echo    OK

echo.
echo ============================================
echo    SITE EN LIGNE !
echo ============================================
echo.
echo    Frontend: http://localhost:8080
echo    Backend:  http://127.0.0.1:8000
echo    Admin:    http://127.0.0.1:8000/admin/
echo.
echo    Login:    admin
echo    Password: admin123
echo.
echo ============================================
echo.
pause
