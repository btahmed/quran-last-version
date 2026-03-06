# QuranReview - Lancement Complet (Simple)
# ==========================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   QURANREVIEW - LANCEMENT" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# 1. Kill existing
Write-Host "`n[1/3] Nettoyage..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 8000,8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } | Out-Null
Write-Host "   OK" -ForegroundColor Green

# 2. Start Backend
Write-Host "`n[2/3] Demarrage Backend..." -ForegroundColor Yellow
$backend = Start-Process -FilePath "C:\dev\QuranReview\backend\venv\Scripts\python.exe" -ArgumentList "C:\dev\QuranReview\backend\manage.py", "runserver", "127.0.0.1:8000" -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 4

# 3. Start Frontend
Write-Host "`n[3/3] Demarrage Frontend..." -ForegroundColor Yellow
$frontend = Start-Process -FilePath "python" -ArgumentList "-m", "http.server", "8080" -WorkingDirectory "C:\dev\QuranReview" -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 2

# 4. Open browser
Write-Host "`nOuverture navigateur..." -ForegroundColor Yellow
Start-Process "http://localhost:8080"

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "   ✅ SITE EN LIGNE !" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "   🌐 http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "   Login: admin / admin123" -ForegroundColor Magenta
Write-Host ""
Write-Host "   [ENTREE] pour arreter" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Green

Read-Host

# Stop
Write-Host "`nArret..." -ForegroundColor Yellow
$backend | Stop-Process -Force -ErrorAction SilentlyContinue
$frontend | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "✅ Arrete" -ForegroundColor Green
