@echo off
chcp 65001 >nul
title QuranReview - Creation Backend

echo ==========================================
echo    Creation du Backend Django
echo ==========================================
echo.

:: Creer le dossier backend
if not exist "backend" mkdir backend
cd backend

echo 📦 Installation de Django...
python -m pip install django djangorestframework djangorestframework-simplejwt django-cors-headers python-dotenv -q

echo.
echo 🚀 Creation du projet Django...
django-admin startproject quranreview .

echo.
echo 📱 Creation de l'app authentication...
cd quranreview
python ..\manage.py startapp authentication
cd ..

echo ✅ Backend cree avec succes !
echo.
echo 📋 Prochaines etapes :
echo 1. Lancez : docker-simple.bat
echo.
pause
