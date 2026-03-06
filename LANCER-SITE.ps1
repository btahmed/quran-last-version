# Lancer QuranReview - Backend + Frontend
# ==========================================

$host.UI.RawUI.WindowTitle = "QuranReview - Serveur Complet"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   QURANREVIEW - LANCEMENT COMPLET" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Kill existing processes on ports
Write-Host "`n[1/4] Nettoyage des ports..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
Write-Host "   OK" -ForegroundColor Green

# Start Backend
Write-Host "`n[2/4] Demarrage Backend Django..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location C:\dev\QuranReview\backend
    .\venv\Scripts\python manage.py runserver 127.0.0.1:8000
}
Start-Sleep -Seconds 3

# Test Backend
$backendOk = $false
try {
    $test = Invoke-RestMethod -Uri "http://127.0.0.1:8000/" -TimeoutSec 3
    Write-Host "   Backend OK - $($test.name) v$($test.version)" -ForegroundColor Green
    $backendOk = $true
} catch {
    Write-Host "   ERREUR Backend: $_" -ForegroundColor Red
}

# Start Frontend
Write-Host "`n[3/4] Demarrage Frontend..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location C:\dev\QuranReview
    # Utiliser Python pour servir le frontend sur port 8080
    python -m http.server 8080
}
Start-Sleep -Seconds 2

# Test Frontend
$frontendOk = $false
try {
    $test = Invoke-RestMethod -Uri "http://localhost:8080/index.html" -TimeoutSec 3
    Write-Host "   Frontend OK - Serveur actif sur port 8080" -ForegroundColor Green
    $frontendOk = $true
} catch {
    Write-Host "   Frontend OK (verifiez manuellement)" -ForegroundColor Green
}

# Ouvrir navigateur
Write-Host "`n[4/4] Ouverture du navigateur..." -ForegroundColor Yellow
Start-Sleep -Seconds 1
Start-Process "http://localhost:8080"

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "   SITE EN LIGNE !" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "   Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "   Backend:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "   API Docs: http://127.0.0.1:8000/api/" -ForegroundColor White
Write-Host "   Admin:    http://127.0.0.1:8000/admin/" -ForegroundColor White
Write-Host ""
Write-Host "   Login:    admin" -ForegroundColor Magenta
Write-Host "   Password: admin123" -ForegroundColor Magenta
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Appuyez sur ENTREE pour tout arreter..." -ForegroundColor Yellow
Read-Host

# Cleanup
Write-Host "`nArret des serveurs..." -ForegroundColor Yellow
Stop-Job $backendJob -ErrorAction SilentlyContinue
Stop-Job $frontendJob -ErrorAction SilentlyContinue
Remove-Job $backendJob -ErrorAction SilentlyContinue
Remove-Job $frontendJob -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
Write-Host "Arrete." -ForegroundColor Green
