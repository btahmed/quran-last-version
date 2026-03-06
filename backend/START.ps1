# Start Django Server
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   QuranReview Backend" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$env:PYTHONPATH = "C:\dev\QuranReview\backend"

Write-Host "Starting server..." -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Yellow
Write-Host "  API:       http://127.0.0.1:8000/api/" -ForegroundColor White
Write-Host "  Admin:     http://127.0.0.1:8000/admin/" -ForegroundColor White
Write-Host "  Login:     http://127.0.0.1:8000/api/token/" -ForegroundColor White
Write-Host ""
Write-Host "Admin credentials: admin / admin123" -ForegroundColor Magenta
Write-Host ""
Write-Host "Ctrl+C to stop" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan

.\venv\Scripts\python manage.py runserver
