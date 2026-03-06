"""
Data models for the Excel Student Import tool.

This module defines all the dataclasses used throughout the import process.
"""

from dataclasses import dataclass
from typing import Optional, List


@dataclass
class StudentData:
    """Données d'un étudiant à importer"""
    first_name: str
    last_name: str
    username: str
    email: Optional[str] = None
    class_name: Optional[str] = None
    row_number: int = 0  # Numéro de ligne dans Excel


@dataclass
class ValidationResult:
    """Résultat de validation d'un étudiant"""
    is_valid: bool
    errors: List[str]
    student: StudentData


@dataclass
class CreationResult:
    """Résultat de création d'un compte"""
    student: StudentData
    success: bool
    password: Optional[str] = None
    error_message: Optional[str] = None
    user_id: Optional[int] = None


@dataclass
class APIResponse:
    """Réponse de l'API Django"""
    success: bool
    status_code: int
    data: Optional[dict] = None
    error: Optional[str] = None


@dataclass
class ImportConfig:
    """Configuration de l'import"""
    excel_file_path: str
    api_base_url: str = "http://127.0.0.1:8000"
    admin_username: str = "admin"
    admin_password: str = "admin123"
    password_strategy: str = "auto"  # 'auto', 'name_year', 'custom'
    output_format: str = "excel"  # 'excel', 'csv', 'pdf'
    output_directory: str = "./output"
    max_retries: int = 3
    retry_delay: int = 2  # secondes


@dataclass
class BatchValidationResult:
    """Résultat de validation d'un lot d'étudiants"""
    valid: List[StudentData]
    invalid: List[ValidationResult]
