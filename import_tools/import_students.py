"""
Main import workflow for Excel student import.

This module implements the main import_students_from_excel() function
that orchestrates the entire import process.
"""

import sys
from pathlib import Path
from typing import List, Optional
from datetime import datetime

# Import all components
try:
    # Try relative imports (when used as a module)
    from .models import (
        ImportConfig, StudentData, CreationResult, BatchValidationResult
    )
    from .excel_reader import ExcelReader, InvalidExcelFormat
    from .data_validator import DataValidator
    from .password_generator import PasswordGenerator
    from .api_client import APIClient, AuthenticationError, APIConnectionError
    from .report_generator import ReportGenerator
except ImportError:
    # Fall back to absolute imports (when run as a script)
    from models import (
        ImportConfig, StudentData, CreationResult, BatchValidationResult
    )
    from excel_reader import ExcelReader, InvalidExcelFormat
    from data_validator import DataValidator
    from password_generator import PasswordGenerator
    from api_client import APIClient, AuthenticationError, APIConnectionError
    from report_generator import ReportGenerator


def import_students_from_excel(config: ImportConfig, dry_run: bool = False) -> List[CreationResult]:
    """
    Import students from Excel file and create accounts via API.
    
    This is the main entry point that orchestrates the entire import workflow:
    1. Authenticate with API
    2. Read Excel file
    3. Validate all students (batch validation)
    4. Generate passwords and create accounts with retry
    5. Add invalid students to results
    6. Generate reports (credentials, summary, errors)
    
    Args:
        config: ImportConfig with all configuration settings
        dry_run: If True, validate only without creating accounts
        
    Returns:
        List of CreationResult for all students (valid and invalid)
        
    Raises:
        FileNotFoundError: If Excel file doesn't exist
        InvalidExcelFormat: If Excel format is invalid
        AuthenticationError: If admin credentials are invalid
        APIConnectionError: If API backend is not accessible
    """
    print("🚀 Starting student import...")
    print()
    
    # Step 1: Authenticate with API (skip in dry-run mode)
    if not dry_run:
        print("🔐 Authenticating with API...")
        api_client = APIClient(
            base_url=config.api_base_url,
            admin_username=config.admin_username,
            admin_password=config.admin_password,
            max_retries=config.max_retries,
            retry_delay=config.retry_delay,
            timeout=config.timeout
        )
        
        try:
            api_client.authenticate()
            print(f"✓ Authenticated as {config.admin_username}")
            print()
        except AuthenticationError as e:
            print(f"❌ Authentication failed: {e}")
            raise
        except APIConnectionError as e:
            print(f"❌ Cannot connect to API: {e}")
            raise
    else:
        api_client = None
        print("🔍 DRY RUN mode - skipping authentication")
        print()
    
    # Step 2: Read Excel file
    print(f"📁 Reading Excel file: {config.excel_file_path}")
    excel_reader = ExcelReader()
    
    try:
        students = excel_reader.read_students(config.excel_file_path)
        print(f"✓ Found {len(students)} students")
        print()
    except FileNotFoundError as e:
        print(f"❌ {e}")
        raise
    except InvalidExcelFormat as e:
        print(f"❌ {e}")
        raise
    
    # Step 3: Validate all students (batch validation)
    print("🔍 Validating data...")
    validator = DataValidator()
    validation_results = validator.validate_batch(students)
    
    valid_count = len(validation_results.valid)
    invalid_count = len(validation_results.invalid)
    
    print(f"✓ {valid_count} students valid")
    if invalid_count > 0:
        print(f"✗ {invalid_count} students invalid")
        print()
        print("Invalid students:")
        for invalid in validation_results.invalid:
            errors_str = ", ".join(invalid.errors)
            print(f"  Row {invalid.student.row_number}: {invalid.student.username} - {errors_str}")
    print()
    
    # Step 4: Generate passwords and create accounts with retry
    results: List[CreationResult] = []
    
    if valid_count > 0 and not dry_run:
        print("👥 Creating student accounts...")
        password_gen = PasswordGenerator()
        
        # Display progress
        for idx, student in enumerate(validation_results.valid, 1):
            # Generate password
            password = password_gen.generate_password(config.password_strategy, student)
            
            # Create account via API with retry logic
            result = _create_student_with_retry(
                api_client=api_client,
                student=student,
                password=password,
                idx=idx,
                total=valid_count
            )
            
            results.append(result)
        
        print()
        print(f"✓ Account creation completed")
        print()
    
    elif valid_count > 0 and dry_run:
        print("🔍 DRY RUN mode - skipping account creation")
        print(f"Would create {valid_count} accounts")
        print()
        
        # In dry-run, create mock results
        password_gen = PasswordGenerator()
        for student in validation_results.valid:
            password = password_gen.generate_password(config.password_strategy, student)
            results.append(CreationResult(
                student=student,
                success=True,
                password=password,
                error_message=None,
                user_id=None
            ))
    
    # Step 5: Add invalid students to results
    for invalid in validation_results.invalid:
        error_msg = "; ".join(invalid.errors)
        results.append(CreationResult(
            student=invalid.student,
            success=False,
            password=None,
            error_message=f"Validation failed: {error_msg}",
            user_id=None
        ))
    
    # Step 6: Generate reports (credentials, summary, errors)
    if not dry_run:
        print("📄 Generating reports...")
        report_gen = ReportGenerator()
        
        # Create output directory
        output_dir = Path(config.output_directory)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate timestamp for filenames
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        
        # Generate credentials file (only successful creations)
        successful_results = [r for r in results if r.success]
        if successful_results:
            credentials_path = output_dir / f"credentials_{timestamp}.{config.output_format}"
            cred_file = report_gen.generate_credentials_file(
                successful_results,
                str(credentials_path),
                config.output_format
            )
            if cred_file:
                print(f"✓ Credentials file: {cred_file}")
        
        # Generate error log (only failed creations)
        failed_results = [r for r in results if not r.success]
        if failed_results:
            errors_path = output_dir / f"errors_{timestamp}"
            error_file = report_gen.generate_error_log(failed_results, str(errors_path))
            if error_file:
                print(f"✓ Error log: {error_file}")
        
        # Generate detailed log
        log_path = output_dir / f"import_{timestamp}"
        log_file = report_gen.generate_detailed_log(results, str(log_path))
        if log_file:
            print(f"✓ Detailed log: {log_file}")
        
        print()
        
        # Display security warning
        if successful_results:
            print("⚠️  SECURITY WARNING:")
            print("   1. The credentials file contains passwords in plain text")
            print("   2. Secure this file and restrict access (file permissions)")
            print("   3. Distribute passwords to students securely")
            print("   4. DELETE the credentials file after distribution")
            print()
    
    # Display final summary
    _display_summary(results)
    
    return results


def _create_student_with_retry(api_client: APIClient, student: StudentData,
                               password: str, idx: int, total: int) -> CreationResult:
    """
    Create a student account with retry logic and progress display.
    
    Args:
        api_client: Authenticated API client
        student: Student data to create
        password: Generated password
        idx: Current index (1-based)
        total: Total number of students
        
    Returns:
        CreationResult with success or error
    """
    # Display progress
    progress_bar = _create_progress_bar(idx, total)
    print(f"\r{progress_bar} {idx}/{total}", end='', flush=True)
    
    # Call API to create student
    response = api_client.create_student(
        username=student.username,
        password=password,
        first_name=student.first_name,
        last_name=student.last_name,
        email=student.email
    )
    
    if response.success:
        user_id = response.data.get('id') if response.data else None
        return CreationResult(
            student=student,
            success=True,
            password=password,
            error_message=None,
            user_id=user_id
        )
    else:
        return CreationResult(
            student=student,
            success=False,
            password=None,
            error_message=response.error,
            user_id=None
        )


def _create_progress_bar(current: int, total: int, width: int = 30) -> str:
    """
    Create a text-based progress bar.
    
    Args:
        current: Current progress value
        total: Total value
        width: Width of progress bar in characters
        
    Returns:
        Progress bar string
    """
    if total == 0:
        return "[" + " " * width + "]"
    
    progress = current / total
    filled = int(width * progress)
    bar = "█" * filled + "░" * (width - filled)
    percentage = int(progress * 100)
    
    return f"[{bar}] {percentage}%"


def _display_summary(results: List[CreationResult]) -> None:
    """
    Display final summary of import results.
    
    Args:
        results: List of all creation results
    """
    total = len(results)
    successful = sum(1 for r in results if r.success)
    failed = total - successful
    success_rate = (successful / total * 100) if total > 0 else 0
    
    print("=" * 60)
    print("✅ IMPORT COMPLETED")
    print("=" * 60)
    print(f"Total students processed: {total}")
    print(f"Successfully created: {successful}")
    print(f"Failed: {failed}")
    print(f"Success rate: {success_rate:.1f}%")
    print("=" * 60)
    
    # Show failed students if any
    if failed > 0:
        print()
        print("Failed students:")
        for result in results:
            if not result.success:
                print(f"  • {result.student.username} (Row {result.student.row_number}): {result.error_message}")


def main():
    """
    Main entry point when running as a script.
    
    This function is called when the script is executed directly.
    It imports and runs the CLI interface.
    """
    try:
        from .cli import main as cli_main
    except ImportError:
        from cli import main as cli_main
    return cli_main()


if __name__ == '__main__':
    sys.exit(main())
