"""
Report generation functionality for student import.

This module handles generation of credentials files and reports.
"""

import pandas as pd
from pathlib import Path
from typing import List
from datetime import datetime

try:
    from .models import CreationResult
except ImportError:
    from models import CreationResult


class ReportGenerator:
    """Generates reports and credentials files"""
    
    def generate_credentials_file(self, results: List[CreationResult],
                                  output_path: str, format: str = 'excel') -> str:
        """
        Génère un fichier avec les identifiants créés
        
        Args:
            results: Liste des résultats de création
            output_path: Chemin du fichier de sortie
            format: 'excel', 'csv', ou 'pdf'
            
        Returns:
            Chemin du fichier généré
        """
        # Filter only successful creations
        successful = [r for r in results if r.success]
        
        if not successful:
            return None
        
        # Prepare data
        data = []
        for result in successful:
            data.append({
                'Username': result.student.username,
                'Password': result.password,
                'Prénom': result.student.first_name,
                'Nom': result.student.last_name,
                'Classe': result.student.class_name or ''
            })
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Create output directory if it doesn't exist
        output_dir = Path(output_path).parent
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate file based on format
        if format == 'excel':
            file_path = output_path if output_path.endswith('.xlsx') else f"{output_path}.xlsx"
            df.to_excel(file_path, index=False)
        elif format == 'csv':
            file_path = output_path if output_path.endswith('.csv') else f"{output_path}.csv"
            df.to_csv(file_path, index=False, encoding='utf-8-sig')
        elif format == 'pdf':
            # PDF generation would require additional library (reportlab or fpdf2)
            # For now, fallback to Excel
            file_path = output_path if output_path.endswith('.xlsx') else f"{output_path}.xlsx"
            df.to_excel(file_path, index=False)
        else:
            # Default to Excel
            file_path = output_path if output_path.endswith('.xlsx') else f"{output_path}.xlsx"
            df.to_excel(file_path, index=False)
        
        return str(Path(file_path).absolute())
    
    def generate_summary_report(self, results: List[CreationResult]) -> str:
        """
        Génère un rapport textuel résumé
        
        Args:
            results: Liste des résultats de création
            
        Returns:
            Texte du rapport formaté
        """
        total = len(results)
        successful = sum(1 for r in results if r.success)
        failed = total - successful
        success_rate = (successful / total * 100) if total > 0 else 0
        
        report = []
        report.append("=" * 60)
        report.append("📊 RÉSUMÉ DE L'IMPORT")
        report.append("=" * 60)
        report.append(f"Total d'étudiants traités: {total}")
        report.append(f"✅ Créations réussies: {successful}")
        report.append(f"❌ Échecs: {failed}")
        report.append(f"📈 Taux de réussite: {success_rate:.1f}%")
        report.append("=" * 60)
        
        return "\n".join(report)
    
    def generate_error_log(self, results: List[CreationResult], log_path: str) -> str:
        """
        Génère un fichier log des erreurs
        
        Args:
            results: Liste des résultats de création
            log_path: Chemin du fichier log
            
        Returns:
            Chemin du fichier log généré
        """
        # Filter only failed creations
        failed = [r for r in results if not r.success]
        
        if not failed:
            return None
        
        # Prepare error data (NO PASSWORDS in error logs)
        data = []
        for result in failed:
            data.append({
                'Username': result.student.username,
                'Prénom': result.student.first_name,
                'Nom': result.student.last_name,
                'Classe': result.student.class_name or '',
                'Ligne Excel': result.student.row_number,
                'Erreur': result.error_message
            })
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Create output directory if it doesn't exist
        log_dir = Path(log_path).parent
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate Excel file for errors
        file_path = log_path if log_path.endswith('.xlsx') else f"{log_path}.xlsx"
        df.to_excel(file_path, index=False)
        
        return str(Path(file_path).absolute())
    
    def generate_detailed_log(self, results: List[CreationResult], log_path: str) -> str:
        """
        Génère un fichier log détaillé (texte)
        
        Args:
            results: Liste des résultats de création
            log_path: Chemin du fichier log
            
        Returns:
            Chemin du fichier log généré
        """
        # Create output directory if it doesn't exist
        log_dir = Path(log_path).parent
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate log content
        log_lines = []
        log_lines.append(f"Import Log - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        log_lines.append("=" * 80)
        log_lines.append("")
        
        for result in results:
            if result.success:
                log_lines.append(f"✅ SUCCESS: {result.student.username} ({result.student.first_name} {result.student.last_name})")
                log_lines.append(f"   User ID: {result.user_id}")
                # NO PASSWORD in logs
            else:
                log_lines.append(f"❌ FAILED: {result.student.username} ({result.student.first_name} {result.student.last_name})")
                log_lines.append(f"   Error: {result.error_message}")
                log_lines.append(f"   Row: {result.student.row_number}")
            log_lines.append("")
        
        # Write to file
        file_path = log_path if log_path.endswith('.log') else f"{log_path}.log"
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(log_lines))
        
        return str(Path(file_path).absolute())
