"""
Utilitaires de sécurité pour l'application Admin
Décorateurs, validation, sanitisation, et rate limiting
"""

import re
import json
import html
from functools import wraps
from django.http import JsonResponse
from django.core.cache import cache
from django.core.validators import validate_email as django_validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# DÉCORATEURS D'AUTHENTIFICATION ET AUTORISATION
# ============================================================================

def admin_required(view_func):
    """
    Décorateur pour vérifier que l'utilisateur est authentifié et a le rôle 'admin'
    
    Usage:
        @admin_required
        def my_view(request):
            # Code accessible uniquement aux admins
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Vérifier l'authentification
        if not request.user.is_authenticated:
            logger.warning(f"Tentative d'accès non authentifié à {view_func.__name__}")
            return JsonResponse({
                'error': 'Non authentifié',
                'message': 'Vous devez être connecté pour accéder à cette ressource'
            }, status=401)
        
        # Vérifier le rôle admin
        if not hasattr(request.user, 'role') or request.user.role != 'admin':
            logger.warning(
                f"Tentative d'accès non autorisé par {request.user.username} "
                f"(role: {getattr(request.user, 'role', 'unknown')}) à {view_func.__name__}"
            )
            return JsonResponse({
                'error': 'Permission refusée',
                'message': 'Vous devez être administrateur pour accéder à cette ressource'
            }, status=403)
        
        # Utilisateur autorisé, exécuter la vue
        return view_func(request, *args, **kwargs)
    
    return wrapper


def teacher_or_admin_required(view_func):
    """
    Décorateur pour vérifier que l'utilisateur est professeur ou admin
    
    Usage:
        @teacher_or_admin_required
        def my_view(request):
            # Code accessible aux professeurs et admins
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                'error': 'Non authentifié',
                'message': 'Vous devez être connecté pour accéder à cette ressource'
            }, status=401)
        
        user_role = getattr(request.user, 'role', None)
        if user_role not in ['admin', 'teacher']:
            logger.warning(
                f"Tentative d'accès non autorisé par {request.user.username} "
                f"(role: {user_role}) à {view_func.__name__}"
            )
            return JsonResponse({
                'error': 'Permission refusée',
                'message': 'Vous devez être professeur ou administrateur'
            }, status=403)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


# ============================================================================
# RATE LIMITING
# ============================================================================

def rate_limit(max_requests=100, window=3600, key_prefix='rate_limit'):
    """
    Décorateur pour limiter le nombre de requêtes par utilisateur
    
    Args:
        max_requests: Nombre maximum de requêtes autorisées
        window: Fenêtre de temps en secondes (défaut: 1 heure)
        key_prefix: Préfixe pour la clé de cache
    
    Usage:
        @rate_limit(max_requests=100, window=3600)
        @admin_required
        def my_view(request):
            # Code avec rate limiting
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Identifier l'utilisateur
            if not request.user.is_authenticated:
                # Pour les utilisateurs non authentifiés, utiliser l'IP
                user_identifier = get_client_ip(request)
            else:
                user_identifier = f"user_{request.user.id}"
            
            cache_key = f'{key_prefix}_{user_identifier}'
            
            # Récupérer le compteur actuel
            current_requests = cache.get(cache_key, 0)
            
            # Vérifier la limite
            if current_requests >= max_requests:
                logger.warning(
                    f"Rate limit dépassé pour {user_identifier} "
                    f"sur {view_func.__name__} ({current_requests}/{max_requests})"
                )
                return JsonResponse({
                    'error': 'Trop de requêtes',
                    'message': f'Limite de {max_requests} requêtes par heure dépassée',
                    'retry_after': window
                }, status=429)
            
            # Incrémenter le compteur
            cache.set(cache_key, current_requests + 1, window)
            
            # Exécuter la vue
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


# ============================================================================
# VALIDATION DES ENTRÉES
# ============================================================================

def validate_group_name(name):
    """
    Valide le format d'un nom de groupe
    
    Args:
        name: Nom du groupe à valider
    
    Returns:
        str: Nom validé
    
    Raises:
        ValidationError: Si le nom est invalide
    """
    if not name or not isinstance(name, str):
        raise ValidationError("Le nom du groupe est requis")
    
    # Nettoyer les espaces
    name = name.strip()
    
    # Vérifier la longueur
    if len(name) < 3:
        raise ValidationError("Le nom du groupe doit contenir au moins 3 caractères")
    
    if len(name) > 100:
        raise ValidationError("Le nom du groupe ne peut pas dépasser 100 caractères")
    
    # Vérifier les caractères autorisés (lettres, chiffres, espaces, tirets, underscores, caractères arabes)
    if not re.match(r'^[\w\s\-\u0600-\u06FF]+$', name, re.UNICODE):
        raise ValidationError(
            "Le nom du groupe ne peut contenir que des lettres, chiffres, espaces, "
            "tirets et underscores"
        )
    
    return name


def validate_email(email):
    """
    Valide une adresse email
    
    Args:
        email: Adresse email à valider
    
    Returns:
        str: Email validé et normalisé
    
    Raises:
        ValidationError: Si l'email est invalide
    """
    if not email:
        raise ValidationError("L'adresse email est requise")
    
    email = email.strip().lower()
    
    try:
        django_validate_email(email)
    except DjangoValidationError:
        raise ValidationError("Format d'adresse email invalide")
    
    return email


def validate_phone(phone):
    """
    Valide un numéro de téléphone
    
    Args:
        phone: Numéro de téléphone à valider
    
    Returns:
        str: Numéro validé
    
    Raises:
        ValidationError: Si le numéro est invalide
    """
    if not phone:
        return ""  # Téléphone optionnel
    
    # Nettoyer le numéro (retirer espaces, tirets, parenthèses)
    phone = re.sub(r'[\s\-\(\)]', '', str(phone))
    
    # Vérifier le format (10-15 chiffres, peut commencer par +)
    if not re.match(r'^\+?[0-9]{10,15}$', phone):
        raise ValidationError(
            "Format de numéro de téléphone invalide. "
            "Utilisez 10-15 chiffres, optionnellement précédés de +"
        )
    
    return phone


def validate_time_slot(time_slot):
    """
    Valide un créneau horaire
    
    Args:
        time_slot: Créneau horaire à valider
    
    Returns:
        str: Créneau validé
    
    Raises:
        ValidationError: Si le créneau est invalide
    """
    valid_slots = ['8h45', '10h45', '14h30', '16h00']
    
    if time_slot not in valid_slots:
        raise ValidationError(
            f"Créneau horaire invalide. Valeurs autorisées: {', '.join(valid_slots)}"
        )
    
    return time_slot


def validate_status(status_value):
    """
    Valide un statut d'élève
    
    Args:
        status_value: Statut à valider
    
    Returns:
        str: Statut validé
    
    Raises:
        ValidationError: Si le statut est invalide
    """
    valid_statuses = ['active', 'inactive', 'graduated']
    
    if status_value not in valid_statuses:
        raise ValidationError(
            f"Statut invalide. Valeurs autorisées: {', '.join(valid_statuses)}"
        )
    
    return status_value


def validate_json_structure(json_data, required_keys=None):
    """
    Valide la structure d'un objet JSON
    
    Args:
        json_data: Données JSON à valider (dict ou str)
        required_keys: Liste des clés requises (optionnel)
    
    Returns:
        dict: Données JSON validées
    
    Raises:
        ValidationError: Si la structure est invalide
    """
    # Convertir en dict si c'est une chaîne
    if isinstance(json_data, str):
        try:
            json_data = json.loads(json_data)
        except json.JSONDecodeError as e:
            raise ValidationError(f"JSON invalide: {str(e)}")
    
    if not isinstance(json_data, dict):
        raise ValidationError("Les données JSON doivent être un objet")
    
    # Vérifier les clés requises
    if required_keys:
        missing_keys = set(required_keys) - set(json_data.keys())
        if missing_keys:
            raise ValidationError(
                f"Clés manquantes dans le JSON: {', '.join(missing_keys)}"
            )
    
    return json_data


# ============================================================================
# SANITISATION DES ENTRÉES
# ============================================================================

def sanitize_input(value, max_length=None):
    """
    Nettoie et sécurise une entrée utilisateur pour éviter XSS
    
    Args:
        value: Valeur à nettoyer
        max_length: Longueur maximale (optionnel)
    
    Returns:
        str: Valeur nettoyée
    """
    if value is None:
        return ""
    
    # Convertir en chaîne
    value = str(value)
    
    # Échapper les caractères HTML
    value = html.escape(value)
    
    # Retirer les caractères de contrôle dangereux
    value = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', value)
    
    # Limiter la longueur si spécifié
    if max_length and len(value) > max_length:
        value = value[:max_length]
    
    return value


def sanitize_dict(data, allowed_fields=None, max_length=1000):
    """
    Nettoie un dictionnaire de données utilisateur
    
    Args:
        data: Dictionnaire à nettoyer
        allowed_fields: Liste des champs autorisés (optionnel)
        max_length: Longueur maximale pour les valeurs texte
    
    Returns:
        dict: Dictionnaire nettoyé
    """
    if not isinstance(data, dict):
        return {}
    
    sanitized = {}
    
    for key, value in data.items():
        # Filtrer les champs non autorisés
        if allowed_fields and key not in allowed_fields:
            continue
        
        # Nettoyer la clé
        clean_key = sanitize_input(key, max_length=100)
        
        # Nettoyer la valeur selon son type
        if isinstance(value, str):
            clean_value = sanitize_input(value, max_length=max_length)
        elif isinstance(value, (int, float, bool)):
            clean_value = value
        elif isinstance(value, dict):
            clean_value = sanitize_dict(value, max_length=max_length)
        elif isinstance(value, list):
            clean_value = [sanitize_input(str(v), max_length=max_length) for v in value]
        else:
            clean_value = sanitize_input(str(value), max_length=max_length)
        
        sanitized[clean_key] = clean_value
    
    return sanitized


# ============================================================================
# UTILITAIRES
# ============================================================================

def get_client_ip(request):
    """
    Récupère l'adresse IP du client
    
    Args:
        request: Objet HttpRequest Django
    
    Returns:
        str: Adresse IP du client
    """
    # Vérifier les headers de proxy
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
    
    return ip


def log_admin_action(action, admin_user, target=None, details=None, request=None):
    """
    Enregistre une action Admin dans les logs applicatifs
    
    Args:
        action: Type d'action effectuée
        admin_user: Utilisateur admin qui effectue l'action
        target: Cible de l'action (utilisateur, groupe, etc.)
        details: Détails supplémentaires (dict)
        request: Objet HttpRequest pour récupérer l'IP
    """
    ip_address = get_client_ip(request) if request else 'unknown'
    
    log_message = f"ADMIN_ACTION: {action} by {admin_user.username}"
    
    if target:
        log_message += f" on {target}"
    
    logger.info(
        log_message,
        extra={
            'admin_id': admin_user.id,
            'admin_username': admin_user.username,
            'action': action,
            'target': str(target) if target else None,
            'details': details,
            'ip_address': ip_address,
            'timestamp': timezone.now().isoformat()
        }
    )


class ValidationError(Exception):
    """Exception personnalisée pour les erreurs de validation"""
    pass
