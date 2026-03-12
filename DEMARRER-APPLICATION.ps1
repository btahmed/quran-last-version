# Script de démarrage de l'application QuranReview
# Ce script démarre le backend Django et le serveur HTTP frontend

Write-Host "🕌 Démarrage de QuranReview..." -ForegroundColor Cyan
Write-Host ""

# Vérifier si Python est installé
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python détecté: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Démarrer le backend Django
Write-Host ""
Write-Host "🔧 Démarrage du backend Django (port 8000)..." -ForegroundColor Yellow

$backendPath = "ancien django\MYSITEE\MYSITEE"
if (Test-Path $backendPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .venv\Scripts\Activate.ps1; python manage.py runserver"
    Write-Host "✅ Backend Django démarré" -ForegroundColor Green
} else {
    Write-Host "❌ Dossier backend introuvable: $backendPath" -ForegroundColor Red
    exit 1
}

# Attendre que le backend démarre
Write-Host "⏳ Attente du démarrage du backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Démarrer le serveur HTTP frontend
Write-Host ""
Write-Host "🌐 Démarrage du serveur HTTP frontend (port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m http.server 3000"
Write-Host "✅ Serveur HTTP démarré" -ForegroundColor Green

# Attendre que le serveur démarre
Start-Sleep -Seconds 2

# Ouvrir le navigateur
Write-Host ""
Write-Host "🚀 Ouverture de l'application dans le navigateur..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "✅ Application démarrée avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Identifiants admin:" -ForegroundColor Cyan
Write-Host "   Username: administrateur" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Pour arrêter l'application, fermez les fenêtres PowerShell ouvertes" -ForegroundColor Yellow
Write-Host ""
