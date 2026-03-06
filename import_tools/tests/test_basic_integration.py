"""
Basic integration tests to verify the import tool components work together.
"""

import pytest
from pathlib import Path
import sys

# Add parent directory to path
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))

# Import from the package
import import_tools.models as models
import import_tools.excel_reader as excel_reader
import import_tools.data_validator as data_validator
import import_tools.password_generator as password_generator

StudentData = models.StudentData
ExcelReader = excel_reader.ExcelReader
DataValidator = data_validator.DataValidator
PasswordGenerator = password_generator.PasswordGenerator


class TestBasicIntegration:
    """Basic integration tests for the import tool."""
    
    def test_excel_reader_with_valid_file(self):
        """Test reading a valid Excel file."""
        fixtures_dir = Path(__file__).parent / "fixtures"
        excel_file = fixtures_dir / "valid_students.xlsx"
        
        if not excel_file.exists():
            pytest.skip("Fixture file not found. Run create_fixtures.py first.")
        
        reader = ExcelReader()
        students = reader.read_students(str(excel_file))
        
        assert len(students) == 10
        assert all(isinstance(s, StudentData) for s in students)
        assert students[0].first_name == "Ahmed"
        assert students[0].last_name == "Benali"
        assert students[0].username == "ahmed"
    
    def test_validator_with_valid_students(self):
        """Test validation with valid student data."""
        students = [
            StudentData(
                first_name="Ahmed",
                last_name="Benali",
                username="ahmed",
                email="ahmed@email.com",
                class_name="3ème A",
                row_number=1
            ),
            StudentData(
                first_name="Fatima",
                last_name="Alaoui",
                username="fatima",
                email="fatima@email.com",
                class_name="3ème B",
                row_number=2
            )
        ]
        
        validator = DataValidator()
        result = validator.validate_batch(students)
        
        assert len(result.valid) == 2
        assert len(result.invalid) == 0
    
    def test_validator_with_invalid_students(self):
        """Test validation with invalid student data."""
        students = [
            StudentData(
                first_name="",  # Invalid: empty first name
                last_name="Benali",
                username="ahmed",
                email="ahmed@email.com",
                class_name="3ème A",
                row_number=1
            ),
            StudentData(
                first_name="Fatima",
                last_name="Alaoui",
                username="ab",  # Invalid: too short
                email="fatima@email.com",
                class_name="3ème B",
                row_number=2
            )
        ]
        
        validator = DataValidator()
        result = validator.validate_batch(students)
        
        assert len(result.valid) == 0
        assert len(result.invalid) == 2
    
    def test_password_generator_auto_strategy(self):
        """Test auto password generation."""
        generator = PasswordGenerator()
        password = generator.generate_auto_password(8)
        
        assert len(password) == 8
        assert password.isalnum()
        # Check no ambiguous characters
        assert '0' not in password
        assert 'O' not in password
        assert 'l' not in password
        assert '1' not in password
        assert 'I' not in password
    
    def test_password_generator_name_year_strategy(self):
        """Test name-based password generation."""
        generator = PasswordGenerator()
        password = generator.generate_name_based_password("Ahmed", "Benali", 2026)
        
        assert password == "ahmed.benali2026"
        assert len(password) >= 6
    
    def test_password_uniqueness(self):
        """Test that generated passwords are unique."""
        generator = PasswordGenerator()
        passwords = [generator.generate_auto_password(8) for _ in range(100)]
        
        # All passwords should be unique
        assert len(passwords) == len(set(passwords))
    
    def test_end_to_end_validation_flow(self):
        """Test the complete validation flow from Excel to validated students."""
        fixtures_dir = Path(__file__).parent / "fixtures"
        excel_file = fixtures_dir / "mixed_students.xlsx"
        
        if not excel_file.exists():
            pytest.skip("Fixture file not found. Run create_fixtures.py first.")
        
        # Step 1: Read Excel
        reader = ExcelReader()
        students = reader.read_students(str(excel_file))
        assert len(students) == 15
        
        # Step 2: Validate
        validator = DataValidator()
        result = validator.validate_batch(students)
        
        # Should have 11 valid and 4 invalid (based on fixture design)
        assert len(result.valid) >= 10  # At least 10 valid
        assert len(result.invalid) >= 3  # At least 3 invalid
        
        # Step 3: Generate passwords for valid students
        generator = PasswordGenerator()
        passwords = {}
        for student in result.valid:
            password = generator.generate_password("auto", student)
            passwords[student.username] = password
            assert len(password) >= 6
        
        # All passwords should be unique
        assert len(passwords) == len(set(passwords.values()))


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
