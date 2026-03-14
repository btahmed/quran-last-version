"""Entry point WSGI pour Vercel Python Runtime."""
import os
import sys

# Ajouter le répertoire parent au path pour que Django trouve les modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quranreview.settings')

from django.core.wsgi import get_wsgi_application

# Vercel cherche 'app' comme point d'entrée WSGI
app = get_wsgi_application()
