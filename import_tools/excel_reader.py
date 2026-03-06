"""
Excel reading functionality for student import.

This module handles reading student data from Excel files.
"""

import pandas as pd
from typing import List
from pathlib import Path

try:
    from .models import StudentData
except ImportError:
    from models import StudentData


class InvalidExcelFormat(Exception):
    """Exception raised when Excel file format is invalid"""
    pass


class ExcelReader:
    """Reads student data from Excel files"""
    
    # Required columns (case-insensitive)
    REQUIRED_COLUMNS = ['prénom', 'nom', 'username']
    
    # Optional columns (case-insensitive)
    OPTIONAL_COLUMNS = ['email', 'classe']
    
    # Column name mappings (variations)
    COLUMN_MAPPINGS = {
        'prénom': ['prénom', 'prenom', 'first name', 'first_name', 'firstname'],
        'nom': ['nom', 'last name', 'last_name', 'lastname', 'nom de famille'],
        'username': ['username', 'nom d\'utilisateur', 'user name', 'user_name'],
        'email': ['email', 'e-mail', 'mail', 'courriel'],
        'classe': ['classe', 'class', 'class_name', 'class name'],
    }
    
    def read_students(self, file_path: str) -> List[StudentData]:
        """
        Lit le fichier Excel et retourne une liste de données étudiants
        
        Args:
            file_path: Chemin vers le fichier Excel
            
        Returns:
            Liste d'objets StudentData
            
        Raises:
            FileNotFoundError: Si le fichier n'existe pas
            InvalidExcelFormat: Si le format est incorrect
        """
        # Check if file exists
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Excel file not found: {file_path}")
        
        # Read Excel file
        try:
            df = pd.read_excel(file_path)
        except Exception as e:
            raise InvalidExcelFormat(f"Failed to read Excel file: {str(e)}")
        
        # Normalize column names (lowercase, strip whitespace, convert to string)
        df.columns = [str(col).lower().strip() for col in df.columns]
        
        # Map column names to standard names
        column_map = {}
        for standard_name, variations in self.COLUMN_MAPPINGS.items():
            for col in df.columns:
                if col in [v.lower() for v in variations]:
                    column_map[col] = standard_name
                    break
        
        # Rename columns
        df = df.rename(columns=column_map)
        
        # Check for required columns
        missing_columns = []
        for required_col in self.REQUIRED_COLUMNS:
            if required_col not in df.columns:
                missing_columns.append(required_col)
        
        if missing_columns:
            # Convert column names to strings for error message
            column_names = [str(col) for col in df.columns]
            raise InvalidExcelFormat(
                f"Missing required columns: {', '.join(missing_columns)}. "
                f"Found columns: {', '.join(column_names)}"
            )
        
        # Convert to StudentData objects
        students = []
        for idx, row in df.iterrows():
            # Convert NaN to None for optional fields
            email = row.get('email')
            if pd.isna(email):
                email = None
            else:
                email = str(email).strip() if email else None
            
            class_name = row.get('classe')
            if pd.isna(class_name):
                class_name = None
            else:
                class_name = str(class_name).strip() if class_name else None
            
            # Create StudentData instance
            student = StudentData(
                first_name=str(row['prénom']).strip(),
                last_name=str(row['nom']).strip(),
                username=str(row['username']).strip(),
                email=email,
                class_name=class_name,
                row_number=idx + 2  # +2 because Excel is 1-indexed and has header row
            )
            students.append(student)
        
        return students
