# Django Submissions System

Audio submission system for students with staff validation and automatic cleanup.

## Features

- Students submit audio files for assigned tasks
- Staff review and approve/reject submissions
- Points awarded automatically on approval (via PointsLog ledger)
- Privacy consent required before submission
- Automatic cleanup of audio files after 14 days

## Local Setup

### 1. Create virtual environment

```bash
cd "ancien django/MYSITEE/MYSITEE"
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install --upgrade pip
pip install "Django>=5.2,<5.3"
```

### 3. Configure environment (optional)

```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Run migrations

```bash
python manage.py migrate
```

### 5. Create superuser

```bash
python manage.py createsuperuser
```

### 6. Run server

```bash
python manage.py runserver
```

Access at: http://127.0.0.1:8000/

## Running Tests

```bash
python manage.py test submissions
```

Expected: 28 tests, all passing.

## Cleanup Command

Delete expired audio files (older than 14 days):

```bash
# Preview (dry run)
python manage.py cleanup_submissions --dry-run

# Execute cleanup
python manage.py cleanup_submissions

# Override: delete files older than N days
python manage.py cleanup_submissions --days 7
```

## Project Structure

```
MYSITEE/
├── mysite/          # Project settings
├── tasks/           # Tasks app (users, teams, tasks)
├── submissions/     # Audio submissions app
├── points/          # Points ledger app
└── manage.py
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| SECRET_KEY | Django secret key | Dev key (insecure) |
| DEBUG | Debug mode | True |
| ALLOWED_HOSTS | Comma-separated hosts | localhost,127.0.0.1 |

## Security Notes

- Never commit `.env` files
- Generate a new SECRET_KEY for production
- Set DEBUG=False in production
- Audio files are deleted after 14 days for privacy
