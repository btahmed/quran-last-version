"""
Script to create performance test fixture Excel files.
Creates files with 50, 200, and 500 students for performance testing.
"""

import pandas as pd
from pathlib import Path
import random

# Get the fixtures directory
fixtures_dir = Path(__file__).parent / "fixtures"
fixtures_dir.mkdir(exist_ok=True)

# Sample data for generation
first_names = [
    "Ahmed", "Fatima", "Mohamed", "Khadija", "Youssef", "Aisha", "Omar", "Salma", "Ali", "Nour",
    "Hassan", "Sara", "Karim", "Leila", "Rachid", "Amina", "Bilal", "Zineb", "Hamza", "Meryem",
    "Anas", "Imane", "Mehdi", "Hiba", "Samir", "Dounia", "Tarik", "Yasmine", "Khalid", "Rim"
]

last_names = [
    "Benali", "Alaoui", "Idrissi", "Mansouri", "Tazi", "Benjelloun", "Fassi", "Chraibi", "Lahlou", "Berrada",
    "Alami", "Amrani", "Bennani", "Cherkaoui", "Douiri", "El Fassi", "Ghazi", "Hamdaoui", "Jilali", "Kettani",
    "Lamrani", "Mernissi", "Naciri", "Ouazzani", "Qadiri", "Raissouni", "Slaoui", "Tounsi", "Wahbi", "Ziani"
]

classes = ["3ème A", "3ème B", "3ème C", "4ème A", "4ème B", "4ème C", "5ème A", "5ème B", "5ème C"]


def generate_students(count: int) -> pd.DataFrame:
    """Generate a DataFrame with the specified number of students."""
    data = {
        "Prénom": [],
        "Nom": [],
        "Username": [],
        "Email": [],
        "Classe": []
    }
    
    for i in range(count):
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        username = f"{first_name.lower()}{i+1}"
        email = f"{username}@email.com"
        class_name = random.choice(classes)
        
        data["Prénom"].append(first_name)
        data["Nom"].append(last_name)
        data["Username"].append(username)
        data["Email"].append(email)
        data["Classe"].append(class_name)
    
    return pd.DataFrame(data)


# Create performance test files
sizes = [50, 200, 500]

for size in sizes:
    print(f"Creating performance_test_{size}_students.xlsx...")
    df = generate_students(size)
    output_file = fixtures_dir / f"performance_test_{size}_students.xlsx"
    df.to_excel(output_file, index=False)
    print(f"✓ Created {output_file} with {len(df)} students")

print("\n✅ All performance test fixture files created successfully!")
print(f"Location: {fixtures_dir}")
