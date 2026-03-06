"""
Entry point for running import_tools as a module.

Usage: python -m import_tools [arguments]
"""

import sys
from .cli import main

if __name__ == '__main__':
    sys.exit(main())
