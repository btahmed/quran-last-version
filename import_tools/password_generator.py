"""
Password generation functionality for student import.

This module handles secure password generation with multiple strategies.
"""

import secrets
from datetime import datetime
from typing import Set

try:
    from .models import StudentData
except ImportError:
    from models import StudentData


class PasswordGenerator:
    """Generates secure passwords for student accounts"""
    
    # Character set excluding ambiguous characters (0, O, l, 1, I)
    CHARSET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    
    # Minimum password length
    MIN_LENGTH = 6
    
    def __init__(self):
        """Initialize password generator with tracking for uniqueness"""
        self.generated_passwords: Set[str] = set()
    
    def generate_password(self, strategy: str, student: StudentData) -> str:
        """
        Génère un mot de passe selon la stratégie choisie
        
        Args:
            strategy: 'auto', 'name_year', ou 'custom'
            student: Données de l'étudiant
            
        Returns:
            Mot de passe généré
        """
        if strategy == "auto":
            password = self.generate_auto_password(8)
        elif strategy == "name_year":
            password = self.generate_name_based_password(
                student.first_name,
                student.last_name,
                datetime.now().year
            )
        elif strategy == "custom":
            # For custom strategy, would need user input
            # For now, fallback to auto
            password = self.generate_auto_password(8)
        else:
            # Default fallback
            password = self.generate_auto_password(8)
        
        # Ensure minimum length
        if len(password) < self.MIN_LENGTH:
            # Pad with random characters if needed
            while len(password) < self.MIN_LENGTH:
                password += secrets.choice(self.CHARSET)
        
        # Ensure uniqueness
        while password in self.generated_passwords:
            # Regenerate if duplicate
            if strategy == "auto":
                password = self.generate_auto_password(8)
            else:
                # Add random suffix for name-based passwords
                password += secrets.choice(self.CHARSET)
        
        self.generated_passwords.add(password)
        return password
    
    def generate_auto_password(self, length: int = 8) -> str:
        """
        Génère un mot de passe aléatoire sécurisé
        
        Args:
            length: Longueur du mot de passe (min 6)
            
        Returns:
            Mot de passe aléatoire
        """
        if length < self.MIN_LENGTH:
            length = self.MIN_LENGTH
        
        password = ''.join(secrets.choice(self.CHARSET) for _ in range(length))
        return password
    
    def generate_name_based_password(self, first_name: str, last_name: str, year: int) -> str:
        """
        Génère un mot de passe basé sur le nom et l'année
        Format: prenom.nom{year}
        
        Args:
            first_name: Prénom de l'étudiant
            last_name: Nom de famille
            year: Année courante
            
        Returns:
            Mot de passe basé sur le nom
        """
        # Normalize names (lowercase, remove spaces and special chars)
        first = first_name.lower().strip().replace(' ', '')
        last = last_name.lower().strip().replace(' ', '')
        
        # Remove accents and special characters (keep only alphanumeric)
        first = ''.join(c for c in first if c.isalnum())
        last = ''.join(c for c in last if c.isalnum())
        
        # Create password in format: firstname.lastname{year}
        password = f"{first}.{last}{year}"
        
        return password
