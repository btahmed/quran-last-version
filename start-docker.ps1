#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Script de lancement automatique Docker pour QuranReview
#>

chcp 65001 | Out-Null
Clear-Host

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   QuranReview - Docker Launcher" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verifier si Docker est installe
Write-Host "Verification de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker non trouve"
    }
    Write-Host "   Docker trouve : $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   Docker n'est pas installe !" -ForegroundColor Red
    Write-Host ""
    Write-Host "Telechargez Docker Desktop :" -ForegroundColor Yellow
    Write-Host "   https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
    Write-Host ""
    pause
    Start-Process "https://www.docker.com/products/docker-desktop"
    exit 1
}

# Verifier si Docker Desktop est en cours d'execution
Write-Host ""
Write-Host "Verification de Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Desktop non demarre"
    }
    Write-Host "   Docker Desktop est actif" -ForegroundColor Green
} catch {
    Write-Host "   Docker Desktop n'est pas demarre !" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Demarrage de Docker Desktop..." -ForegroundColor Cyan
    
    $dockerPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
        Write-Host ""
        Write-Host "Attente du demarrage de Docker (30s max)..." -ForegroundColor Yellow
        
        $maxAttempts = 30
        $attempt = 0
        $dockerReady = $false
        
        while ($attempt -lt $maxAttempts -and -not $dockerReady) {
            Start-Sleep -Seconds 1
            $attempt++
            Write-Host "   Attente... ($attempt/$maxAttempts)" -ForegroundColor Gray
            
            try {
                $null = docker info 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $dockerReady = $true
                }
            } catch {}
        }
        
        if (-not $dockerReady) {
            Write-Host ""
            Write-Host "   Docker n'a pas demarre a temps" -ForegroundColor Red
            Write-Host "   Veuillez demarrer Docker Desktop manuellement" -ForegroundColor Yellow
            pause
            exit 1
        }
        
        Write-Host "   Docker Desktop est maintenant actif" -ForegroundColor Green
    } else {
        Write-Host "   Impossible de trouver Docker Desktop" -ForegroundColor Red
        pause
        exit 1
    }
}

# Preparer les fichiers frontend
Write-Host ""
Write-Host "Preparation des fichiers frontend..." -ForegroundColor Yellow

# Creer le dossier frontend si inexistant
if (!(Test-Path "frontend")) {
    New-Item -ItemType Directory -Path "frontend" -Force | Out-Null
}

# Copier les fichiers
$filesToCopy = @("index.html", "style-pro.css", "script.js", "style.css", "manifest.json")
foreach ($file in $filesToCopy) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination "frontend/" -Force
        Write-Host "   Copie : $file" -ForegroundColor Green
    }
}

# Copier les dossiers
if (Test-Path "assets") {
    if (!(Test-Path "frontend/assets")) {
        New-Item -ItemType Directory -Path "frontend/assets" -Force | Out-Null
    }
    Copy-Item -Path "assets/*" -Destination "frontend/assets/" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Copie : dossier assets/" -ForegroundColor Green
}

if (Test-Path "images") {
    if (!(Test-Path "frontend/images")) {
        New-Item -ItemType Directory -Path "frontend/images" -Force | Out-Null
    }
    Copy-Item -Path "images/*" -Destination "frontend/images/" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Copie : dossier images/" -ForegroundColor Green
}

# Verifier le backend
Write-Host ""
Write-Host "Verification du backend..." -ForegroundColor Yellow
if (Test-Path "backend/manage.py") {
    Write-Host "   Backend Django trouve" -ForegroundColor Green
} else {
    Write-Host "   Backend Django non trouve dans backend/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Le backend est optionnel. L'app fonctionnera en mode demo." -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Voulez-vous continuer sans backend ? (O/n)"
    if ($continue -eq "n") {
        exit 0
    }
}

# Lancer Docker Compose
Write-Host ""
Write-Host "Lancement de l'application..." -ForegroundColor Cyan
Write-Host "   Cette operation peut prendre quelques minutes la premiere fois" -ForegroundColor Gray
Write-Host ""

# Arreter les conteneurs existants si presents
docker-compose down 2>$null | Out-Null

# Construire et demarrer
docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "   Application demarree !" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "URLs d'acces :" -ForegroundColor Cyan
    Write-Host "   Frontend : http://localhost" -ForegroundColor White
    Write-Host "   Backend  : http://localhost:8000" -ForegroundColor White
    Write-Host ""
    Write-Host "Commandes utiles :" -ForegroundColor Yellow
    Write-Host "   Voir les logs  : docker-compose logs -f" -ForegroundColor Gray
    Write-Host "   Arrêter        : docker-compose down" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Appuyez sur une touche pour ouvrir le navigateur..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Start-Process "http://localhost"
} else {
    Write-Host ""
    Write-Host "Erreur lors du demarrage" -ForegroundColor Red
    Write-Host ""
    Write-Host "Essayez de lancer manuellement :" -ForegroundColor Yellow
    Write-Host "   docker-compose up --build" -ForegroundColor Cyan
    pause
}
