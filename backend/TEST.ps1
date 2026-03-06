# Test complet du backend QuranReview
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   TEST BACKEND QURANREVIEW" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Test 1: Django check
Write-Host "`n[1/5] Django system check..." -ForegroundColor Yellow
$check = .\venv\Scripts\python manage.py check 2>&1
if ($check -match "no issues") {
    Write-Host "   ✅ OK" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERREUR: $check" -ForegroundColor Red
}

# Test 2: Database
Write-Host "`n[2/5] Database connection..." -ForegroundColor Yellow
$dbTest = .\venv\Scripts\python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quranreview.settings')
import django
django.setup()
from authentication.models import User
print('Users:', User.objects.count())
" 2>&1
if ($dbTest -match "Users:") {
    Write-Host "   ✅ OK - $dbTest" -ForegroundColor Green
} else {
    Write-Host "   ❌ ERREUR" -ForegroundColor Red
}

# Test 3: Lancer serveur temporairement
Write-Host "`n[3/5] Test serveur API..." -ForegroundColor Yellow
$server = Start-Process -FilePath ".\venv\Scripts\python" -ArgumentList "manage.py", "runserver", "127.0.0.1:8888" -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 3

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8888/api/auth/token/" -Method Post -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}' -TimeoutSec 5
    if ($response.access) {
        Write-Host "   ✅ OK - Login fonctionne!" -ForegroundColor Green
        Write-Host "   Token recu: $($response.access.Substring(0,20))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ ERREUR API: $_" -ForegroundColor Red
}

# Arreter serveur test
$server | Stop-Process -Force

# Test 4: Verifier fichiers statiques
Write-Host "`n[4/5] Fichiers de configuration..." -ForegroundColor Yellow
$files = @("manage.py", "quranreview/settings.py", "authentication/models.py", "api/models.py")
$allOk = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file manquant" -ForegroundColor Red
        $allOk = $false
    }
}

# Test 5: Migrations
Write-Host "`n[5/5] Migrations..." -ForegroundColor Yellow
$migrations = .\venv\Scripts\python manage.py showmigrations --plan 2>&1 | Select-String "NO migrations"
if (-not $migrations) {
    Write-Host "   ✅ Toutes les migrations sont appliquees" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Migrations en attente" -ForegroundColor Yellow
}

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "   DIAGNOSTIC TERMINE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "`nPour lancer le serveur:" -ForegroundColor White
Write-Host "   .\venv\Scripts\python manage.py runserver" -ForegroundColor Yellow
Write-Host "`nURLs de test:" -ForegroundColor White
Write-Host "   http://127.0.0.1:8000/api/auth/token/" -ForegroundColor Yellow
Write-Host "   http://127.0.0.1:8000/admin/" -ForegroundColor Yellow
Write-Host "`nLogin admin: admin / admin123" -ForegroundColor Magenta
