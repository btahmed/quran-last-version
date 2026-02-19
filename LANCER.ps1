# Lancer QuranReview avec Docker
# Usage: .\LANCER.ps1

$projectPath = "C:\dev\QuranReview"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   QuranReview - Lancement Docker" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

Set-Location $projectPath

Write-Host "[1/3] Arret des conteneurs existants..." -ForegroundColor Yellow
docker-compose down 2>$null

Write-Host "[2/3] Construction et lancement..." -ForegroundColor Yellow
docker-compose up --build -d

Write-Host "[3/3] Verification..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
docker-compose ps

Write-Host "" 
Write-Host "============================================" -ForegroundColor Green
Write-Host "   ✅ QuranReview est lance!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "   Frontend:  http://localhost" -ForegroundColor White
Write-Host "   Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "   Admin:     http://localhost:8000/admin" -ForegroundColor White
Write-Host ""
Write-Host "   Logs:      docker-compose logs -f" -ForegroundColor Gray
Write-Host "   Arreter:   docker-compose down" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Green
