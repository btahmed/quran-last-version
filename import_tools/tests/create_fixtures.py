"""
Script to create test fixture Excel files for the import tool.
Run this script to generate valid_students.xlsx, invalid_students.xlsx, and mixed_students.xlsx
"""

import pandas as pd
from pathlib import Path

# Get the fixtures directory
fixtures_dir = Path(__file__).parent / "fixtures"
fixtures_dir.mkdir(exist_ok=True)

# 1. Create valid_students.xlsx
print("Creating valid_students.xlsx...")
valid_data = {
    "Prénom": ["Ahmed", "Fatima", "Mohamed", "Khadija", "Youssef", "Aisha", "Omar", "Salma", "Ali", "Nour"],
    "Nom": ["Benali", "Alaoui", "Idrissi", "Mansouri", "Tazi", "Benjelloun", "Fassi", "Chraibi", "Lahlou", "Berrada"],
    "Username": ["ahmed", "fatima", "mohamed", "khadija", "youssef", "aisha", "omar", "salma", "ali", "nour"],
    "Email": [
        "ahmed@email.com",
        "fatima@email.com",
        "mohamed@email.com",
        "khadija@email.com",
        "youssef@email.com",
        "aisha@email.com",
        "omar@email.com",
        "salma@email.com",
        "ali@email.com",
        "nour@email.com"
    ],
    "Classe": ["3ème A", "3ème B", "3ème A", "3ème C", "3ème B", "3ème A", "3ème C", "3ème B", "3ème A", "3ème C"]
}

df_valid = pd.DataFrame(valid_data)
df_valid.to_excel(fixtures_dir / "valid_students.xlsx", index=False)
print(f"✓ Created {fixtures_dir / 'valid_students.xlsx'} with {len(df_valid)} valid students")

# 2. Create invalid_students.xlsx
print("\nCreating invalid_students.xlsx...")
invalid_data = {
    "Prénom": ["", "Hassan", "Sara", "Karim", "Leila", "Rachid", "Amina", "Bilal"],
    "Nom": ["Alami", "", "Amrani", "Bennani", "Cherkaoui", "Douiri", "El Fassi", "Ghazi"],
    "Username": ["", "hassan", "ab", "karim@123", "leila", "rachid", "amina", "bilal"],
    "Email": [
        "valid@email.com",
        "hassan@email.com",
        "invalid-email",
        "karim@email.com",
        "leila@email.com",
        "rachid@email.com",
        "not-an-email",
        "bilal@email.com"
    ],
    "Classe": ["3ème A", "3ème B", "3ème A", "3ème C", "3ème B", "3ème A", "3ème C", "3ème B"]
}

df_invalid = pd.DataFrame(invalid_data)
df_invalid.to_excel(fixtures_dir / "invalid_students.xlsx", index=False)
print(f"✓ Created {fixtures_dir / 'invalid_students.xlsx'} with {len(df_invalid)} invalid students")
print("  Errors:")
print("    - Row 1: Empty first name")
print("    - Row 2: Empty last name")
print("    - Row 3: Username too short (ab)")
print("    - Row 4: Username with invalid characters (karim@123)")
print("    - Row 3: Invalid email format (invalid-email)")
print("    - Row 7: Invalid email format (not-an-email)")

# 3. Create mixed_students.xlsx
print("\nCreating mixed_students.xlsx...")
mixed_data = {
    "Prénom": [
        "Ahmed", "Fatima", "", "Khadija", "Youssef",  # Row 3 invalid (empty first name)
        "Aisha", "Omar", "Salma", "Ali", "Nour",
        "Hassan", "Sara", "Karim", "Leila", "Rachid"
    ],
    "Nom": [
        "Benali", "Alaoui", "Idrissi", "Mansouri", "Tazi",
        "Benjelloun", "", "Chraibi", "Lahlou", "Berrada",  # Row 7 invalid (empty last name)
        "Alami", "Amrani", "Bennani", "Cherkaoui", "Douiri"
    ],
    "Username": [
        "ahmed", "fatima", "mohamed", "khadija", "youssef",
        "aisha", "omar", "ab", "ali", "nour",  # Row 8 invalid (username too short)
        "hassan", "sara", "karim@123", "leila", "rachid"  # Row 13 invalid (invalid characters)
    ],
    "Email": [
        "ahmed@email.com", "fatima@email.com", "mohamed@email.com", "khadija@email.com", "youssef@email.com",
        "aisha@email.com", "omar@email.com", "salma@email.com", "ali@email.com", "nour@email.com",
        "hassan@email.com", "invalid-email", "karim@email.com", "leila@email.com", "rachid@email.com"  # Row 12 invalid email
    ],
    "Classe": [
        "3ème A", "3ème B", "3ème A", "3ème C", "3ème B",
        "3ème A", "3ème C", "3ème B", "3ème A", "3ème C",
        "3ème A", "3ème B", "3ème A", "3ème C", "3ème B"
    ]
}

df_mixed = pd.DataFrame(mixed_data)
df_mixed.to_excel(fixtures_dir / "mixed_students.xlsx", index=False)
print(f"✓ Created {fixtures_dir / 'mixed_students.xlsx'} with {len(df_mixed)} students (11 valid, 4 invalid)")
print("  Valid students: 11")
print("  Invalid students: 4")
print("    - Row 3: Empty first name")
print("    - Row 7: Empty last name")
print("    - Row 8: Username too short (ab)")
print("    - Row 12: Invalid email format (invalid-email)")
print("    - Row 13: Username with invalid characters (karim@123)")

print("\n✅ All fixture files created successfully!")
print(f"Location: {fixtures_dir}")
