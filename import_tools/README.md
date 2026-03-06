# Excel Student Import Tool

Outil d'importation en masse d'étudiants depuis un fichier Excel vers le système QuranReview. Cet outil lit un fichier Excel, valide les données, génère des mots de passe sécurisés, crée les comptes via l'API Django, et exporte les identifiants pour distribution.

## Table des Matières

- [Installation](#installation)
- [Démarrage Rapide](#démarrage-rapide)
- [Utilisation CLI](#utilisation-cli)
- [Configuration](#configuration)
- [Format du Fichier Excel](#format-du-fichier-excel)
- [Stratégies de Mot de Passe](#stratégies-de-mot-de-passe)
- [Formats de Sortie](#formats-de-sortie)
- [Dépannage](#dépannage)
- [Bonnes Pratiques de Sécurité](#bonnes-pratiques-de-sécurité)
- [Exemples](#exemples)

## Installation

### Prérequis

- Python 3.8 ou supérieur
- Backend Django QuranReview en cours d'exécution
- Compte administrateur valide

### Installation des Dépendances

```bash
cd QuranReviewLocal/import_tools
pip install -r requirements.txt
```

### Vérification de l'Installation

```bash
python -m import_tools --help
```

## Démarrage Rapide

### 1. Générer un Template Excel

```bash
python -m import_tools --generate-template
```

Cela crée un fichier `template_students.xlsx` avec les colonnes requises et des exemples.

### 2. Remplir le Template

Ouvrez `template_students.xlsx` et ajoutez vos étudiants:

| Prénom | Nom    | Username | Email (optionnel) | Classe (optionnel) |
|--------|--------|----------|-------------------|-------------------|
| Ahmed  | Benali | ahmed    | ahmed@email.com   | 3ème A            |
| Fatima | Alaoui | fatima   |                   | 3ème B            |

### 3. Lancer l'Import

```bash
python -m import_tools template_students.xlsx
```

### 4. Récupérer les Identifiants

Les identifiants créés sont dans `output/credentials.xlsx`.

## Utilisation CLI

### Commandes de Base

```bash
# Afficher l'aide
python -m import_tools --help

# Générer un template
python -m import_tools --generate-template

# Import basique
python -m import_tools students.xlsx

# Import avec configuration personnalisée
python -m import_tools students.xlsx --config config.json

# Validation sans création (dry-run)
python -m import_tools students.xlsx --dry-run

# Mode verbeux
python -m import_tools students.xlsx --verbose
```

### Options Disponibles

| Option | Description | Valeur par Défaut |
|--------|-------------|-------------------|
| `--config` | Chemin vers le fichier de configuration JSON | Aucun |
| `--api-url` | URL de base de l'API Django | http://127.0.0.1:8000 |
| `--admin-user` | Nom d'utilisateur admin | admin |
| `--admin-pass` | Mot de passe admin | admin123 |
| `--password-strategy` | Stratégie de génération de mot de passe (auto/name_year) | auto |
| `--output-format` | Format de sortie (excel/csv/pdf) | excel |
| `--output-dir` | Répertoire de sortie | ./output |
| `--dry-run` | Valider sans créer les comptes | False |
| `--verbose` | Afficher les détails | False |
| `--generate-template` | Générer un template Excel | False |

### Exemples de Commandes

```bash
# Import avec mot de passe basé sur le nom
python -m import_tools students.xlsx --password-strategy name_year

# Export en CSV
python -m import_tools students.xlsx --output-format csv

# API distante
python -m import_tools students.xlsx --api-url http://192.168.1.100:8000

# Combinaison d'options
python -m import_tools students.xlsx \
  --password-strategy name_year \
  --output-format csv \
  --output-dir ./exports \
  --verbose
```

## Configuration

### Fichier de Configuration

Créez un fichier `config.json` pour réutiliser les mêmes paramètres:

```json
{
  "api": {
    "base_url": "http://127.0.0.1:8000",
    "admin_username": "admin",
    "admin_password": "admin123",
    "timeout": 30,
    "max_retries": 3,
    "retry_delay": 2
  },
  "password": {
    "strategy": "auto",
    "length": 8
  },
  "output": {
    "format": "excel",
    "directory": "./output"
  },
  "validation": {
    "min_username_length": 3,
    "max_username_length": 150
  }
}
```

### Utilisation du Fichier de Configuration

```bash
python -m import_tools students.xlsx --config config.json
```

**Note**: Les options CLI ont la priorité sur le fichier de configuration.

### Variables d'Environnement

Vous pouvez aussi utiliser des variables d'environnement:

```bash
export API_BASE_URL=http://127.0.0.1:8000
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD=admin123

python -m import_tools students.xlsx
```

## Format du Fichier Excel

### Colonnes Requises

| Colonne | Description | Exemple |
|---------|-------------|---------|
| **Prénom** | Prénom de l'étudiant | Ahmed |
| **Nom** | Nom de famille | Benali |
| **Username** | Nom d'utilisateur unique (min 3 caractères, alphanumérique) | ahmed |

### Colonnes Optionnelles

| Colonne | Description | Exemple |
|---------|-------------|---------|
| **Email** | Adresse email (format valide si fourni) | ahmed@email.com |
| **Classe** | Classe ou groupe | 3ème A |

### Règles de Validation

- **Prénom**: Non vide, max 150 caractères
- **Nom**: Non vide, max 150 caractères
- **Username**: 
  - Non vide
  - Min 3 caractères, max 150 caractères
  - Alphanumérique + underscore uniquement
  - Unique dans le fichier et la base de données
- **Email**: Format email valide si fourni (optionnel)
- **Classe**: Optionnel, max 100 caractères

### Exemple de Fichier Valide

```
| Prénom  | Nom      | Username | Email             | Classe |
|---------|----------|----------|-------------------|--------|
| Ahmed   | Benali   | ahmed    | ahmed@email.com   | 3ème A |
| Fatima  | Alaoui   | fatima   |                   | 3ème B |
| Mohamed | Idrissi  | mohamed  | mohamed@email.com | 3ème A |
| Khadija | Mansouri | khadija  | khadija@email.com |        |
```

### Notes Importantes

- La première ligne doit contenir les en-têtes
- Les noms de colonnes sont insensibles à la casse
- Les cellules vides sont acceptées pour les champs optionnels
- Les caractères spéciaux (accents, traits d'union) sont préservés
- Le fichier peut contenir d'autres colonnes (elles seront ignorées)

## Stratégies de Mot de Passe

### Auto (Par Défaut)

Génère un mot de passe aléatoire de 8 caractères.

**Caractéristiques**:
- Longueur: 8 caractères
- Caractères: a-z, A-Z, 2-9
- Exclut les caractères ambigus: 0, O, l, 1, I
- Cryptographiquement sécurisé (utilise `secrets`)

**Exemple**: `aB3kM7pQ`

```bash
python -m import_tools students.xlsx --password-strategy auto
```

### Name Year

Génère un mot de passe basé sur le nom et l'année courante.

**Format**: `prenom.nom{année}`

**Exemple**: `ahmed.benali2026`

```bash
python -m import_tools students.xlsx --password-strategy name_year
```

**Avantages**: Facile à mémoriser pour les étudiants
**Inconvénients**: Moins sécurisé, prévisible

## Formats de Sortie

### Excel (Par Défaut)

Fichier `.xlsx` avec les identifiants créés.

```bash
python -m import_tools students.xlsx --output-format excel
```

**Colonnes**: Username, Password, Prénom, Nom, Classe

### CSV

Fichier `.csv` compatible avec Excel et autres outils.

```bash
python -m import_tools students.xlsx --output-format csv
```

**Avantages**: Léger, facile à importer dans d'autres systèmes

### PDF

Fichier `.pdf` pour impression et distribution.

```bash
python -m import_tools students.xlsx --output-format pdf
```

**Avantages**: Non modifiable, professionnel

## Dépannage

### Problème: "FileNotFoundError: students.xlsx"

**Cause**: Le fichier Excel n'existe pas ou le chemin est incorrect.

**Solution**:
```bash
# Vérifier le chemin
ls students.xlsx

# Utiliser le chemin absolu
python -m import_tools /chemin/complet/vers/students.xlsx
```

### Problème: "AuthenticationError: Invalid credentials"

**Cause**: Les identifiants admin sont incorrects.

**Solution**:
```bash
# Vérifier les identifiants
python -m import_tools students.xlsx \
  --admin-user votre_admin \
  --admin-pass votre_mot_de_passe
```

### Problème: "APIConnectionError: Cannot connect to API"

**Cause**: Le backend Django n'est pas accessible.

**Solution**:
```bash
# Vérifier que le backend tourne
curl http://127.0.0.1:8000/api/health

# Démarrer le backend si nécessaire
cd QuranReviewLocal/backend
python manage.py runserver
```

### Problème: "InvalidExcelFormat: Missing required columns"

**Cause**: Le fichier Excel n'a pas les colonnes requises.

**Solution**:
```bash
# Générer un template valide
python -m import_tools --generate-template

# Copier vos données dans le template
```

### Problème: "Username already exists"

**Cause**: Un nom d'utilisateur existe déjà dans la base de données.

**Solution**:
- Modifier le username dans le fichier Excel
- Ajouter un suffixe (ex: ahmed2, ahmed3)
- Vérifier les doublons dans le fichier

### Problème: Import Lent

**Cause**: Beaucoup d'étudiants ou connexion lente.

**Solution**:
- Diviser le fichier en plusieurs petits fichiers
- Vérifier la connexion réseau
- Utiliser `--verbose` pour voir la progression

### Problème: "Validation failed"

**Cause**: Données invalides dans le fichier Excel.

**Solution**:
1. Consulter le fichier `output/errors.xlsx` pour voir les erreurs
2. Corriger les données invalides
3. Réimporter uniquement les lignes corrigées

## Bonnes Pratiques de Sécurité

### 1. Protéger le Fichier de Credentials

```bash
# Définir les permissions (Linux/Mac)
chmod 600 output/credentials.xlsx

# Ou déplacer dans un dossier sécurisé
mv output/credentials.xlsx ~/secure/
```

### 2. Supprimer Après Distribution

```bash
# Supprimer le fichier après avoir distribué les mots de passe
rm output/credentials.xlsx
```

### 3. Ne Pas Commiter les Credentials

Ajoutez à `.gitignore`:
```
output/
*.xlsx
config.json
```

### 4. Utiliser des Variables d'Environnement

Au lieu de mettre le mot de passe admin dans `config.json`:

```bash
export ADMIN_PASSWORD=votre_mot_de_passe_secret
python -m import_tools students.xlsx
```

### 5. Changer les Mots de Passe Temporaires

Encouragez les étudiants à changer leur mot de passe lors de la première connexion.

### 6. Limiter l'Accès au Script

Seuls les administrateurs devraient avoir accès à cet outil.

### 7. Vérifier les Logs

Consultez `output/import.log` pour détecter les activités suspectes.

## Exemples

### Exemple 1: Import Basique

```bash
# Générer le template
python -m import_tools --generate-template

# Remplir avec 10 étudiants
# ... éditer template_students.xlsx ...

# Importer
python -m import_tools template_students.xlsx

# Résultat:
# ✓ 10 comptes créés
# ✓ output/credentials.xlsx généré
```

### Exemple 2: Import avec Configuration

```bash
# Créer config.json
cat > config.json << EOF
{
  "api": {
    "base_url": "http://127.0.0.1:8000",
    "admin_username": "admin",
    "admin_password": "admin123"
  },
  "password": {
    "strategy": "name_year"
  },
  "output": {
    "format": "csv"
  }
}
EOF

# Importer avec config
python -m import_tools students.xlsx --config config.json
```

### Exemple 3: Validation Avant Import

```bash
# Dry-run pour vérifier les données
python -m import_tools students.xlsx --dry-run

# Si tout est OK, importer pour de vrai
python -m import_tools students.xlsx
```

### Exemple 4: Gestion des Erreurs

```bash
# Import avec données mixtes (valides + invalides)
python -m import_tools mixed_students.xlsx --verbose

# Consulter les erreurs
cat output/errors.xlsx

# Corriger les erreurs dans le fichier
# ... éditer mixed_students.xlsx ...

# Réimporter uniquement les lignes corrigées
python -m import_tools mixed_students_fixed.xlsx
```

### Exemple 5: Import de Grande Liste

```bash
# Fichier avec 500 étudiants
python -m import_tools large_class.xlsx --verbose

# Progression affichée:
# [████████████████████████████] 500/500 (100%)
# 
# Résumé:
#   Total: 500
#   Créés: 498
#   Échecs: 2
#   Taux de succès: 99.6%
```

### Exemple 6: Export Multi-Format

```bash
# Générer Excel et CSV
python -m import_tools students.xlsx --output-format excel
python -m import_tools students.xlsx --output-format csv

# Résultat:
# output/credentials.xlsx
# output/credentials.csv
```

## Structure des Fichiers de Sortie

### credentials.xlsx / credentials.csv

Contient les comptes créés avec succès:

| Username | Password | Prénom | Nom    | Classe |
|----------|----------|--------|--------|--------|
| ahmed    | aB3kM7pQ | Ahmed  | Benali | 3ème A |
| fatima   | xY9nP2mK | Fatima | Alaoui | 3ème B |

### errors.xlsx

Contient les étudiants qui n'ont pas pu être créés:

| Ligne | Prénom | Nom    | Username | Erreur                          |
|-------|--------|--------|----------|---------------------------------|
| 5     | Ali    | Hassan | ab       | Username trop court (min 3)     |
| 12    | Sara   | Amrani | ahmed    | Username déjà existant          |

### import.log

Log détaillé de l'import:

```
2026-02-20 14:30:15 - INFO - Starting student import
2026-02-20 14:30:15 - INFO - Reading Excel file: students.xlsx
2026-02-20 14:30:16 - INFO - Found 25 students
2026-02-20 14:30:16 - INFO - Validating data...
2026-02-20 14:30:16 - INFO - 23 students valid, 2 invalid
2026-02-20 14:30:16 - INFO - Authenticating with API...
2026-02-20 14:30:17 - INFO - Authenticated as admin
2026-02-20 14:30:17 - INFO - Creating student accounts...
2026-02-20 14:30:18 - INFO - Created: ahmed
2026-02-20 14:30:19 - INFO - Created: fatima
...
2026-02-20 14:30:45 - INFO - Import completed: 23/25 success
```

## Support et Contribution

### Signaler un Bug

Si vous rencontrez un problème:

1. Vérifiez la section [Dépannage](#dépannage)
2. Consultez les logs dans `output/import.log`
3. Créez une issue avec:
   - Version de Python
   - Commande exécutée
   - Message d'erreur complet
   - Fichier de log (sans mots de passe!)

### Demander une Fonctionnalité

Ouvrez une issue avec:
- Description de la fonctionnalité
- Cas d'usage
- Exemple d'utilisation souhaité

## Licence

Ce projet fait partie du système QuranReview.

## Auteurs

Développé par l'équipe QuranReview avec l'assistance de Kiro AI.

---

**Version**: 1.0  
**Dernière Mise à Jour**: 2026-02-20
