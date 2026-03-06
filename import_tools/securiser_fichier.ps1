# Script PowerShell pour sécuriser le fichier des identifiants
# Usage: .\securiser_fichier.ps1

Write-Host "🔐 Sécurisation du fichier des identifiants" -ForegroundColor Yellow
Write-Host "=" * 50

$credentialsFile = "output\credentials_2026-02-20_09-59-27.excel.xlsx"

# Vérifier que le fichier existe
if (-not (Test-Path $credentialsFile)) {
    Write-Host "❌ Fichier non trouvé: $credentialsFile" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Fichier trouvé: $credentialsFile" -ForegroundColor Green

# Afficher les permissions actuelles
Write-Host "`n🔍 Permissions actuelles:"
icacls $credentialsFile

# Sécuriser le fichier
Write-Host "`n🔒 Application des permissions sécurisées..."

# Supprimer l'héritage et les permissions existantes
icacls $credentialsFile /inheritance:r

# Donner accès complet seulement au propriétaire actuel
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
icacls $credentialsFile /grant:r "$currentUser`:F"

Write-Host "✅ Permissions appliquées pour: $currentUser" -ForegroundColor Green

# Afficher les nouvelles permissions
Write-Host "`n🔍 Nouvelles permissions:"
icacls $credentialsFile

# Informations sur le fichier
$fileInfo = Get-Item $credentialsFile
Write-Host "`n📊 Informations du fichier:"
Write-Host "   Taille: $($fileInfo.Length) bytes"
Write-Host "   Créé: $($fileInfo.CreationTime)"
Write-Host "   Modifié: $($fileInfo.LastWriteTime)"

Write-Host "`n⚠️  RAPPELS SÉCURITÉ:" -ForegroundColor Yellow
Write-Host "   1. Ce fichier contient 121 mots de passe en clair"
Write-Host "   2. Distribuez les identifiants de manière sécurisée"
Write-Host "   3. SUPPRIMEZ ce fichier après distribution complète"
Write-Host "   4. Ne commitez JAMAIS ce fichier dans Git"

Write-Host "`n✅ Sécurisation terminée!" -ForegroundColor Green