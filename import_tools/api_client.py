"""
API client functionality for student import.

This module handles communication with the Django API backend.
"""

import requests
import time
from typing import Optional

try:
    from .models import APIResponse
except ImportError:
    from models import APIResponse


class AuthenticationError(Exception):
    """Exception raised when authentication fails"""
    pass


class APIConnectionError(Exception):
    """Exception raised when API connection fails"""
    pass


class APIClient:
    """Communicates with the Django API backend"""
    
    def __init__(self, base_url: str, admin_username: str, admin_password: str, 
                 max_retries: int = 3, retry_delay: int = 2, timeout: int = 30):
        """
        Initialise le client API
        
        Args:
            base_url: URL de base de l'API (ex: http://127.0.0.1:8000)
            admin_username: Nom d'utilisateur admin
            admin_password: Mot de passe admin
            max_retries: Nombre maximum de tentatives
            retry_delay: Délai entre les tentatives (secondes)
            timeout: Timeout des requêtes (secondes)
        """
        self.base_url = base_url.rstrip('/')
        self.admin_username = admin_username
        self.admin_password = admin_password
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.timeout = timeout
        self.session = requests.Session()
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
    
    def authenticate(self) -> bool:
        """
        Authentifie avec l'API et obtient les tokens JWT
        
        Returns:
            True si authentification réussie
            
        Raises:
            AuthenticationError: Si l'authentification échoue
            APIConnectionError: Si la connexion à l'API échoue
        """
        url = f"{self.base_url}/api/token/"
        payload = {
            "username": self.admin_username,
            "password": self.admin_password
        }
        
        try:
            response = self.session.post(url, json=payload, timeout=self.timeout)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access')
                self.refresh_token = data.get('refresh')
                
                # Set authorization header for future requests
                self.session.headers.update({
                    'Authorization': f'Bearer {self.access_token}'
                })
                
                return True
            else:
                raise AuthenticationError(
                    f"Authentication failed with status {response.status_code}: {response.text}"
                )
        
        except requests.exceptions.Timeout:
            raise APIConnectionError(f"Connection timeout to {url}")
        except requests.exceptions.ConnectionError as e:
            raise APIConnectionError(f"Cannot connect to API at {url}: {str(e)}")
        except requests.exceptions.RequestException as e:
            raise APIConnectionError(f"API request failed: {str(e)}")
    
    def is_authenticated(self) -> bool:
        """Vérifie si le client est authentifié"""
        return self.access_token is not None
    
    def create_student(self, username: str, password: str, first_name: str,
                      last_name: str, email: Optional[str] = None) -> APIResponse:
        """
        Crée un compte étudiant via l'API
        
        Args:
            username: Nom d'utilisateur unique
            password: Mot de passe
            first_name: Prénom
            last_name: Nom de famille
            email: Email (optionnel)
            
        Returns:
            APIResponse avec succès/erreur et détails
        """
        if not self.is_authenticated():
            raise AuthenticationError("Not authenticated. Call authenticate() first.")
        
        url = f"{self.base_url}/api/admin/users/create/"
        payload = {
            "username": username,
            "password": password,
            "first_name": first_name,
            "last_name": last_name,
            "role": "student"
        }
        
        if email:
            payload["email"] = email
        
        # Try with retries for server errors
        attempts = 0
        last_error = None
        
        while attempts < self.max_retries:
            try:
                response = self.session.post(url, json=payload, timeout=self.timeout)
                
                if response.status_code == 201:
                    # Success
                    data = response.json()
                    return APIResponse(
                        success=True,
                        status_code=201,
                        data=data,
                        error=None
                    )
                
                elif response.status_code == 400:
                    # Client error (validation, duplicate) - don't retry
                    error_data = response.json() if response.text else {}
                    error_msg = error_data.get('error', response.text)
                    return APIResponse(
                        success=False,
                        status_code=400,
                        data=None,
                        error=error_msg
                    )
                
                elif response.status_code >= 500:
                    # Server error - retry
                    last_error = f"Server error {response.status_code}: {response.text}"
                    attempts += 1
                    if attempts < self.max_retries:
                        time.sleep(self.retry_delay)
                    continue
                
                else:
                    # Other error - don't retry
                    return APIResponse(
                        success=False,
                        status_code=response.status_code,
                        data=None,
                        error=f"Unexpected status {response.status_code}: {response.text}"
                    )
            
            except requests.exceptions.Timeout:
                # Timeout - retry
                last_error = f"Request timeout after {self.timeout} seconds"
                attempts += 1
                if attempts < self.max_retries:
                    time.sleep(self.retry_delay)
                continue
            
            except requests.exceptions.RequestException as e:
                # Network error - retry
                last_error = f"Network error: {str(e)}"
                attempts += 1
                if attempts < self.max_retries:
                    time.sleep(self.retry_delay)
                continue
        
        # Max retries reached
        return APIResponse(
            success=False,
            status_code=0,
            data=None,
            error=f"Max retries reached. Last error: {last_error}"
        )
    
    def check_username_exists(self, username: str) -> bool:
        """
        Vérifie si un nom d'utilisateur existe déjà (optionnel)
        
        Args:
            username: Nom d'utilisateur à vérifier
            
        Returns:
            True si existe, False sinon
        """
        # This is an optional optimization
        # For now, we'll rely on the 400 error from create_student
        # Could be implemented if the API provides a check endpoint
        return False
