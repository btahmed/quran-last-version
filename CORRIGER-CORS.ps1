# Corriger le problème CORS
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   CORRECTION CORS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$settingsFile = "C:\dev\QuranReview\backend\quranreview\settings.py"

# Lire le fichier
$content = Get-Content $settingsFile -Raw

# Vérifier si déjà corrigé
if ($content -match "CORS_ALLOW_ALL_ORIGINS = True") {
    Write-Host "`n✅ CORS est déjà configuré correctement !" -ForegroundColor Green
} else {
    Write-Host "`n[1/2] Modification de settings.py..." -ForegroundColor Yellow
    
    # Remplacer la configuration CORS
    $oldCors = 'CORS_ALLOWED_ORIGINS = \[\s*"http://localhost",[\s\S]*?\]'
    $newCors = @'
# CORS - Autoriser tout en développement
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ['*', 'content-type', 'authorization', 'accept']
'@
    
    $content = $content -replace $oldCors, $newCors
    
    # Sauvegarder
    $content | Set-Content $settingsFile -Encoding UTF8
    
    Write-Host "   ✅ Configuration CORS mise à jour" -ForegroundColor Green
}

Write-Host "`n[2/2] Test du backend..." -ForegroundColor Yellow

# Test backend
cd C:\dev\QuranReview\backend
try {
    $test = .\venv\Scripts\python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quranreview.settings')
import django
django.setup()
print('OK: Django charge correctement')
print('CORS:', django.conf.settings.CORS_ALLOW_ALL_ORIGINS)
" 2>&1
    Write-Host "   $test" -ForegroundColor Green
} catch {
    Write-Host "   Erreur: $_" -ForegroundColor Red
}

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "   ✅ CORRECTION TERMINÉE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "`nPour lancer le site :" -ForegroundColor White
Write-Host "`n1. Terminal 1 (BACKEND) :" -ForegroundColor Yellow
Write-Host "   cd C:\dev\QuranReview\backend" -ForegroundColor Gray
Write-Host "   .\venv\Scripts\python manage.py runserver" -ForegroundColor Gray
Write-Host "`n2. Terminal 2 (FRONTEND) :" -ForegroundColor Yellow  
Write-Host "   cd C:\dev\QuranReview" -ForegroundColor Gray
Write-Host "   python -m http.server 8080" -ForegroundColor Gray
Write-Host "`n3. Navigateur :" -ForegroundColor Yellow
Write-Host "   http://localhost:8080" -ForegroundColor Gray
Write-Host "`nLogin: admin / admin123" -ForegroundColor Magenta
