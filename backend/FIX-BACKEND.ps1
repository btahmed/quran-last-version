# Fix Backend Script - QuranReview
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Fix Backend Django" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Clean up
Write-Host "[1/5] Nettoyage..." -ForegroundColor Yellow
Remove-Item -Recurse -Force venv -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force data -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Recurse -Filter "*.pyc" -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path . -Recurse -Filter "__pycache__" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
if (Test-Path authentication\migrations) { Remove-Item -Recurse -Force authentication\migrations }
if (Test-Path api\migrations) { Remove-Item -Recurse -Force api\migrations }
New-Item -ItemType Directory -Path authentication\migrations -Force | Out-Null
New-Item -ItemType Directory -Path api\migrations -Force | Out-Null
"# migrations" | Out-File -FilePath authentication\migrations\__init__.py
"# migrations" | Out-File -FilePath api\migrations\__init__.py

# Create venv
Write-Host "[2/5] Creation environnement virtuel..." -ForegroundColor Yellow
python -m venv venv

# Activate
Write-Host "[3/5] Activation..." -ForegroundColor Yellow
.\venv\Scripts\activate

# Install requirements
Write-Host "[4/5] Installation dependances..." -ForegroundColor Yellow
pip install -r requirements.txt

# Make migrations
Write-Host "[5/5] Creation migrations..." -ForegroundColor Yellow
python manage.py makemigrations authentication
python manage.py makemigrations api
python manage.py migrate

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "   ✅ Backend fixe!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Lancer avec: python manage.py runserver" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Green
