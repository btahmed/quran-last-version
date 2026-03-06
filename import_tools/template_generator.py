"""Template generation for student import tool."""

import os
import pandas as pd
from typing import Optional


def generate_template(output_path: Optional[str] = None) -> str:
    """
    Generate an empty Excel template file for student import.
    
    The template includes:
    - Required column headers: Prénom, Nom, Username
    - Optional column headers: Email (optionnel), Classe (optionnel)
    - 2 example rows with sample data
    
    Args:
        output_path: Path where template should be saved (default: template_students.xlsx)
        
    Returns:
        Full path to the generated template file
        
    Raises:
        FileExistsError: If file exists and user doesn't confirm overwrite
        PermissionError: If unable to write to output path
    """
    if output_path is None:
        output_path = "template_students.xlsx"
    
    # Check if file already exists
    if os.path.exists(output_path):
        response = input(f"File '{output_path}' already exists. Overwrite? (y/n): ")
        if response.lower() not in ['y', 'yes', 'o', 'oui']:
            raise FileExistsError(f"Template generation cancelled: {output_path} already exists")
    
    # Create DataFrame with column headers
    columns = [
        "Prénom",
        "Nom",
        "Username",
        "Email (optionnel)",
        "Classe (optionnel)"
    ]
    
    # Add example rows with sample data
    example_data = [
        {
            "Prénom": "Ahmed",
            "Nom": "Benali",
            "Username": "ahmed",
            "Email (optionnel)": "ahmed@email.com",
            "Classe (optionnel)": "3ème A"
        },
        {
            "Prénom": "Fatima",
            "Nom": "Alaoui",
            "Username": "fatima",
            "Email (optionnel)": "",
            "Classe (optionnel)": "3ème B"
        }
    ]
    
    df = pd.DataFrame(example_data, columns=columns)
    
    # Write to Excel file
    try:
        df.to_excel(output_path, index=False, engine='openpyxl')
    except PermissionError:
        raise PermissionError(f"Unable to write to {output_path}. Check file permissions.")
    except Exception as e:
        raise Exception(f"Error creating template file: {e}")
    
    # Get absolute path
    abs_path = os.path.abspath(output_path)
    
    return abs_path


def main():
    """Main entry point for template generation."""
    try:
        template_path = generate_template()
        print(f"✓ Template generated successfully!")
        print(f"  Path: {template_path}")
        print(f"\nNext steps:")
        print(f"  1. Open the template file in Excel")
        print(f"  2. Replace the example rows with your student data")
        print(f"  3. Run: python import_students.py {os.path.basename(template_path)}")
    except FileExistsError as e:
        print(f"⚠️  {e}")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == '__main__':
    main()
