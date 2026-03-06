"""
Data validation functionality for student import.

This module handles validation of student data before account creation.
"""

import re
from typing import List, Set

try:
    from .models import StudentData, ValidationResult, BatchValidationResult
except ImportError:
    from models import StudentData, ValidationResult, BatchValidationResult


class DataValidator:
    """Validates student data before import"""
    
    # Email regex pattern (basic validation)
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    
    # Username pattern (alphanumeric + underscore only)
    USERNAME_PATTERN = re.compile(r'^[a-zA-Z0-9_]+$')
    
    def validate_student(self, student: StudentData) -> ValidationResult:
        """
        Valide les données d'un étudiant
        
        Args:
            student: Données de l'étudiant à valider
            
        Returns:
            ValidationResult avec is_valid et liste d'erreurs
        """
        errors = []
        
        # Validate required fields
        if not student.first_name or not student.first_name.strip():
            errors.append("Prénom manquant")
        elif len(student.first_name) > 150:
            errors.append("Prénom trop long (max 150 caractères)")
        
        if not student.last_name or not student.last_name.strip():
            errors.append("Nom de famille manquant")
        elif len(student.last_name) > 150:
            errors.append("Nom de famille trop long (max 150 caractères)")
        
        if not student.username or not student.username.strip():
            errors.append("Nom d'utilisateur manquant")
        else:
            # Validate username length
            if len(student.username) < 3:
                errors.append("Nom d'utilisateur trop court (min 3 caractères)")
            elif len(student.username) > 150:
                errors.append("Nom d'utilisateur trop long (max 150 caractères)")
            
            # Validate username format (alphanumeric + underscore only)
            if not self.USERNAME_PATTERN.match(student.username):
                errors.append("Nom d'utilisateur invalide (alphanumérique uniquement)")
        
        # Validate email if provided
        if student.email and student.email.strip():
            if not self.EMAIL_PATTERN.match(student.email):
                errors.append("Format email invalide")
        
        # Validate class_name length if provided
        if student.class_name and len(student.class_name) > 100:
            errors.append("Nom de classe trop long (max 100 caractères)")
        
        is_valid = len(errors) == 0
        return ValidationResult(is_valid=is_valid, errors=errors, student=student)
    
    def validate_batch(self, students: List[StudentData]) -> BatchValidationResult:
        """
        Valide un lot d'étudiants et détecte les doublons
        
        Args:
            students: Liste des étudiants à valider
            
        Returns:
            BatchValidationResult avec étudiants valides/invalides
        """
        valid_students = []
        invalid_results = []
        seen_usernames: Set[str] = set()
        
        for student in students:
            # First validate the student data
            validation_result = self.validate_student(student)
            
            # Check for duplicate usernames within the batch
            if student.username and student.username.lower() in seen_usernames:
                validation_result.errors.append("Nom d'utilisateur en double dans le fichier")
                validation_result.is_valid = False
            else:
                if student.username:
                    seen_usernames.add(student.username.lower())
            
            # Categorize student
            if validation_result.is_valid:
                valid_students.append(student)
            else:
                invalid_results.append(validation_result)
        
        return BatchValidationResult(valid=valid_students, invalid=invalid_results)
