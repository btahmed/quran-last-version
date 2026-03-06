# Start Backend Only
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   QURANREVIEW BACKEND" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

cd C:\dev\QuranReview\backend

# Kill existing
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

Write-Host "`nDemarrage du serveur Django..." -ForegroundColor Yellow
Write-Host "URL: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Admin: http://127.0.0.1:8000/admin/" -ForegroundColor Green
Write-Host "API: http://127.0.0.1:8000/api/" -ForegroundColor Green
Write-Host "`nLogin: admin / admin123" -ForegroundColor Magenta
Write-Host "`nCtrl+C pour arreter" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan

.\venv\Scripts\python manage.py runserver 127.0.0.1:8000
