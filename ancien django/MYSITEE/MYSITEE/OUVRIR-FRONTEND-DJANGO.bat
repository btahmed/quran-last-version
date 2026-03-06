@echo off
echo ========================================
echo   OUVERTURE DU FRONTEND DJANGO
echo ========================================
echo.
echo Ouverture du site Django dans le navigateur...
echo URL: http://127.0.0.1:8000/
echo.

REM Ouvrir l'URL dans le navigateur par défaut
start http://127.0.0.1:8000/

echo.
echo Site ouvert!
echo.
echo IDENTIFIANTS ADMIN:
echo - Username: administrateur
echo - Password: admin123
echo.
echo Si le site ne s'ouvre pas, verifiez que le serveur Django est en cours d'execution.
echo.
pause
