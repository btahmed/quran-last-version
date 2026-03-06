"""Command-line interface for student import tool."""

import argparse
import sys
from typing import Optional

try:
    from .config import ImportConfig, load_config, ConfigurationError
except ImportError:
    from config import ImportConfig, load_config, ConfigurationError


def create_parser() -> argparse.ArgumentParser:
    """
    Create and configure argument parser for CLI.
    
    Returns:
        Configured ArgumentParser instance
    """
    parser = argparse.ArgumentParser(
        prog='import_students',
        description='Import students from Excel file and create accounts via Django API',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate template file
  python import_students.py --generate-template
  
  # Basic import with default settings
  python import_students.py students.xlsx
  
  # Import with custom config file
  python import_students.py students.xlsx --config config.json
  
  # Import with inline options
  python import_students.py students.xlsx --api-url http://localhost:8000 --password-strategy name_year
  
  # Dry run (validate only, don't create accounts)
  python import_students.py students.xlsx --dry-run
  
  # Verbose output
  python import_students.py students.xlsx --verbose
        """
    )
    
    # Positional argument (optional when using --generate-template)
    parser.add_argument(
        'excel_file',
        nargs='?',
        help='Path to Excel file containing student data'
    )
    
    # Template generation
    parser.add_argument(
        '--generate-template',
        action='store_true',
        help='Generate an empty Excel template file and exit'
    )
    
    # Configuration file
    parser.add_argument(
        '--config',
        metavar='PATH',
        help='Path to JSON configuration file'
    )
    
    # API configuration
    api_group = parser.add_argument_group('API Configuration')
    api_group.add_argument(
        '--api-url',
        metavar='URL',
        help='Django API base URL (default: http://127.0.0.1:8000)'
    )
    api_group.add_argument(
        '--admin-user',
        metavar='USERNAME',
        help='Admin username for API authentication (default: admin)'
    )
    api_group.add_argument(
        '--admin-pass',
        metavar='PASSWORD',
        help='Admin password for API authentication (default: admin123)'
    )
    
    # Password configuration
    password_group = parser.add_argument_group('Password Configuration')
    password_group.add_argument(
        '--password-strategy',
        choices=['auto', 'name_year', 'custom'],
        help='Password generation strategy (default: auto)'
    )
    
    # Output configuration
    output_group = parser.add_argument_group('Output Configuration')
    output_group.add_argument(
        '--output-format',
        choices=['excel', 'csv', 'pdf'],
        help='Credentials file output format (default: excel)'
    )
    output_group.add_argument(
        '--output-dir',
        metavar='PATH',
        help='Output directory for generated files (default: ./output)'
    )
    
    # Execution options
    exec_group = parser.add_argument_group('Execution Options')
    exec_group.add_argument(
        '--dry-run',
        action='store_true',
        help='Validate data only, do not create accounts'
    )
    exec_group.add_argument(
        '--verbose',
        action='store_true',
        help='Display detailed progress information'
    )
    
    return parser


def parse_args(args: Optional[list] = None) -> argparse.Namespace:
    """
    Parse command-line arguments.
    
    Args:
        args: List of arguments to parse (defaults to sys.argv)
        
    Returns:
        Parsed arguments namespace
    """
    parser = create_parser()
    return parser.parse_args(args)


def build_config_from_args(args: argparse.Namespace) -> ImportConfig:
    """
    Build ImportConfig from parsed command-line arguments.
    
    CLI arguments take precedence over config file values.
    
    Args:
        args: Parsed command-line arguments
        
    Returns:
        ImportConfig object with merged configuration
        
    Raises:
        ConfigurationError: If configuration is invalid
    """
    # Load base config from file if provided
    if args.config:
        config = load_config(args.config)
    else:
        config = load_config()
    
    # Override with CLI arguments (CLI takes precedence)
    if args.excel_file:
        config.excel_file_path = args.excel_file
    
    if args.api_url:
        config.api_base_url = args.api_url
    
    if args.admin_user:
        config.admin_username = args.admin_user
    
    if args.admin_pass:
        config.admin_password = args.admin_pass
    
    if args.password_strategy:
        config.password_strategy = args.password_strategy
    
    if args.output_format:
        config.output_format = args.output_format
    
    if args.output_dir:
        config.output_directory = args.output_dir
    
    # Set verbose mode
    if args.verbose:
        config.log_level = 'DEBUG'
        config.console_output = True
    
    return config


def validate_args(args: argparse.Namespace) -> None:
    """
    Validate command-line arguments.
    
    Args:
        args: Parsed arguments to validate
        
    Raises:
        SystemExit: If arguments are invalid
    """
    # If not generating template, Excel file is required
    if not args.generate_template and not args.excel_file:
        print("Error: Excel file path is required (or use --generate-template)")
        print("Run with --help for usage information")
        sys.exit(1)
    
    # If generating template, Excel file should not be provided
    if args.generate_template and args.excel_file:
        print("Warning: Excel file path ignored when using --generate-template")


def print_help() -> None:
    """Print help message."""
    parser = create_parser()
    parser.print_help()


def main() -> int:
    """
    Main CLI entry point.
    
    Returns:
        Exit code (0 for success, non-zero for error)
    """
    try:
        args = parse_args()
        validate_args(args)
        
        # Handle template generation
        if args.generate_template:
            try:
                from .template_generator import generate_template
            except ImportError:
                from template_generator import generate_template
            template_path = generate_template()
            print(f"✓ Template generated: {template_path}")
            return 0
        
        # Build configuration
        config = build_config_from_args(args)
        
        # Import and run main import function
        try:
            from .import_students import import_students_from_excel
        except ImportError:
            from import_students import import_students_from_excel
        
        if args.dry_run:
            print("🔍 Running in DRY RUN mode (validation only, no accounts will be created)")
        
        results = import_students_from_excel(config, dry_run=args.dry_run)
        
        # Display summary
        total = len(results)
        success = sum(1 for r in results if r.success)
        failed = total - success
        
        print(f"\n{'='*60}")
        print(f"Import Summary:")
        print(f"  Total students: {total}")
        print(f"  Created: {success}")
        print(f"  Failed: {failed}")
        print(f"  Success rate: {(success/total*100) if total > 0 else 0:.1f}%")
        print(f"{'='*60}")
        
        return 0 if failed == 0 else 1
        
    except ConfigurationError as e:
        print(f"❌ Configuration error: {e}", file=sys.stderr)
        return 1
    except FileNotFoundError as e:
        print(f"❌ File not found: {e}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("\n⚠️  Import cancelled by user", file=sys.stderr)
        return 130
    except Exception as e:
        print(f"❌ Unexpected error: {e}", file=sys.stderr)
        if args.verbose if 'args' in locals() else False:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
