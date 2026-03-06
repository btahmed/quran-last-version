from django.http import JsonResponse


def home(request):
    """API Home page"""
    return JsonResponse({
        "name": "QuranReview API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "admin": "/admin/",
            "api": "/api/",
            "auth": "/api/auth/",
            "login": "/api/auth/token/",
            "register": "/api/auth/register/",
        }
    })
