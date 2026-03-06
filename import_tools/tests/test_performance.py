"""
Performance tests for the import tool.
Tests reading, validation, and password generation performance with different file sizes.
"""

import time
import psutil
import os
from pathlib import Path
import sys

# Add parent directory to path
parent_dir = Path(__file__).parent.parent
sys.path.insert(0, str(parent_dir))

# Import modules directly
from excel_reader import ExcelReader
from data_validator import DataValidator
from password_generator import PasswordGenerator


def get_memory_usage_mb():
    """Get current memory usage in MB."""
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / 1024 / 1024


def test_performance(file_size: int):
    """Test performance with a specific file size."""
    fixtures_dir = Path(__file__).parent / "fixtures"
    excel_file = fixtures_dir / f"performance_test_{file_size}_students.xlsx"
    
    if not excel_file.exists():
        print(f"⚠️  Fixture file not found: {excel_file}")
        print("   Run create_performance_fixtures.py first.")
        return None
    
    print(f"\n{'='*60}")
    print(f"Testing with {file_size} students")
    print(f"{'='*60}")
    
    # Measure initial memory
    initial_memory = get_memory_usage_mb()
    print(f"Initial memory: {initial_memory:.2f} MB")
    
    # Step 1: Read Excel file
    print("\n1. Reading Excel file...")
    start_time = time.time()
    reader = ExcelReader()
    students = reader.read_students(str(excel_file))
    read_time = time.time() - start_time
    print(f"   ✓ Read {len(students)} students in {read_time:.2f} seconds")
    
    # Step 2: Validate data
    print("\n2. Validating data...")
    start_time = time.time()
    validator = DataValidator()
    result = validator.validate_batch(students)
    validate_time = time.time() - start_time
    print(f"   ✓ Validated in {validate_time:.2f} seconds")
    print(f"   Valid: {len(result.valid)}, Invalid: {len(result.invalid)}")
    
    # Step 3: Generate passwords
    print("\n3. Generating passwords...")
    start_time = time.time()
    generator = PasswordGenerator()
    passwords = {}
    for student in result.valid:
        password = generator.generate_password("auto", student)
        passwords[student.username] = password
    password_time = time.time() - start_time
    print(f"   ✓ Generated {len(passwords)} passwords in {password_time:.2f} seconds")
    
    # Measure final memory
    final_memory = get_memory_usage_mb()
    memory_used = final_memory - initial_memory
    print(f"\nFinal memory: {final_memory:.2f} MB")
    print(f"Memory used: {memory_used:.2f} MB")
    
    # Calculate total time
    total_time = read_time + validate_time + password_time
    print(f"\nTotal processing time: {total_time:.2f} seconds")
    
    # Performance targets
    targets = {
        50: 30,   # < 30 seconds
        200: 180, # < 3 minutes
        500: 600  # < 10 minutes
    }
    
    target_time = targets.get(file_size, 600)
    if total_time < target_time:
        print(f"✅ PASS: Processing time ({total_time:.2f}s) is under target ({target_time}s)")
    else:
        print(f"❌ FAIL: Processing time ({total_time:.2f}s) exceeds target ({target_time}s)")
    
    # Memory target: < 100 MB
    if memory_used < 100:
        print(f"✅ PASS: Memory usage ({memory_used:.2f} MB) is under target (100 MB)")
    else:
        print(f"❌ FAIL: Memory usage ({memory_used:.2f} MB) exceeds target (100 MB)")
    
    return {
        "file_size": file_size,
        "students": len(students),
        "read_time": read_time,
        "validate_time": validate_time,
        "password_time": password_time,
        "total_time": total_time,
        "memory_used": memory_used,
        "pass_time": total_time < target_time,
        "pass_memory": memory_used < 100
    }


def main():
    """Run performance tests for all file sizes."""
    print("="*60)
    print("PERFORMANCE VALIDATION")
    print("="*60)
    
    results = []
    for size in [50, 200, 500]:
        result = test_performance(size)
        if result:
            results.append(result)
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"\n{'Size':<10} {'Time (s)':<12} {'Memory (MB)':<15} {'Status'}")
    print("-"*60)
    
    all_pass = True
    for r in results:
        status = "✅ PASS" if r["pass_time"] and r["pass_memory"] else "❌ FAIL"
        if not (r["pass_time"] and r["pass_memory"]):
            all_pass = False
        print(f"{r['file_size']:<10} {r['total_time']:<12.2f} {r['memory_used']:<15.2f} {status}")
    
    print("\n" + "="*60)
    if all_pass:
        print("✅ ALL PERFORMANCE TESTS PASSED")
    else:
        print("❌ SOME PERFORMANCE TESTS FAILED")
    print("="*60)


if __name__ == "__main__":
    main()
