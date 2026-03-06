"""Configuration management for student import tool."""

import json
import os
from typing import Optional, Dict, Any
from dataclasses import dataclass, field
from dotenv import load_dotenv


class ConfigurationError(Exception):
    """Raised when configuration is invalid or malformed."""
    pass


@dataclass
class ImportConfig:
    """Configuration for student import."""
    excel_file_path: str = ""
    api_base_url: str = "http://127.0.0.1:8000"
    admin_username: str = "admin"
    admin_password: str = ""
    password_strategy: str = "auto"
    output_format: str = "excel"
    output_directory: str = "./output"
    max_retries: int = 3
    retry_delay: int = 2
    timeout: int = 30
    min_username_length: int = 3
    max_username_length: int = 150
    allow_empty_email: bool = True
    allow_empty_class: bool = True
    log_level: str = "INFO"
    log_file: str = "import.log"
    console_output: bool = True


def load_config(config_path: Optional[str] = None) -> ImportConfig:
    """
    Load configuration from JSON file and environment variables.
    
    Priority order (highest to lowest):
    1. Environment variables
    2. Config file values
    3. Default values
    
    Args:
        config_path: Path to JSON config file (optional)
        
    Returns:
        ImportConfig object with loaded configuration
        
    Raises:
        ConfigurationError: If config file is malformed or invalid
    """
    # Load environment variables from .env file if present
    load_dotenv()
    
    # Start with default config
    config = ImportConfig()
    
    # Load from config file if provided
    if config_path:
        if not os.path.exists(config_path):
            raise ConfigurationError(f"Config file not found: {config_path}")
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config_data = json.load(f)
        except json.JSONDecodeError as e:
            raise ConfigurationError(f"Malformed JSON in config file: {e}")
        except Exception as e:
            raise ConfigurationError(f"Error reading config file: {e}")
        
        # Apply config file values
        _apply_config_data(config, config_data)
    
    # Override with environment variables
    _apply_env_variables(config)
    
    # Validate configuration
    _validate_config(config)
    
    return config


def _apply_config_data(config: ImportConfig, data: Dict[str, Any]) -> None:
    """Apply configuration data from JSON file to config object."""
    # API configuration
    if 'api' in data:
        api = data['api']
        if 'base_url' in api:
            config.api_base_url = api['base_url']
        if 'admin_username' in api:
            config.admin_username = api['admin_username']
        if 'admin_password' in api:
            config.admin_password = api['admin_password']
        if 'timeout' in api:
            config.timeout = api['timeout']
        if 'max_retries' in api:
            config.max_retries = api['max_retries']
        if 'retry_delay' in api:
            config.retry_delay = api['retry_delay']
    
    # Password configuration
    if 'password' in data:
        pwd = data['password']
        if 'strategy' in pwd:
            config.password_strategy = pwd['strategy']
    
    # Output configuration
    if 'output' in data:
        output = data['output']
        if 'format' in output:
            config.output_format = output['format']
        if 'directory' in output:
            config.output_directory = output['directory']
    
    # Validation configuration
    if 'validation' in data:
        val = data['validation']
        if 'allow_empty_email' in val:
            config.allow_empty_email = val['allow_empty_email']
        if 'allow_empty_class' in val:
            config.allow_empty_class = val['allow_empty_class']
        if 'min_username_length' in val:
            config.min_username_length = val['min_username_length']
        if 'max_username_length' in val:
            config.max_username_length = val['max_username_length']
    
    # Logging configuration
    if 'logging' in data:
        log = data['logging']
        if 'level' in log:
            config.log_level = log['level']
        if 'file' in log:
            config.log_file = log['file']
        if 'console' in log:
            config.console_output = log['console']


def _apply_env_variables(config: ImportConfig) -> None:
    """Apply environment variables to config object."""
    if os.getenv('API_URL'):
        config.api_base_url = os.getenv('API_URL')
    
    if os.getenv('ADMIN_USERNAME'):
        config.admin_username = os.getenv('ADMIN_USERNAME')
    
    if os.getenv('ADMIN_PASSWORD'):
        config.admin_password = os.getenv('ADMIN_PASSWORD')


def _validate_config(config: ImportConfig) -> None:
    """
    Validate configuration values.
    
    Raises:
        ConfigurationError: If any configuration value is invalid
    """
    # Validate API URL
    if not config.api_base_url:
        raise ConfigurationError("API base URL cannot be empty")
    
    if not config.api_base_url.startswith(('http://', 'https://')):
        raise ConfigurationError(f"Invalid API URL: {config.api_base_url}")
    
    # Validate admin credentials
    if not config.admin_username:
        raise ConfigurationError("Admin username cannot be empty")
    
    if not config.admin_password:
        raise ConfigurationError("Admin password cannot be empty")
    
    # Validate password strategy
    valid_strategies = ['auto', 'name_year', 'custom']
    if config.password_strategy not in valid_strategies:
        raise ConfigurationError(
            f"Invalid password strategy: {config.password_strategy}. "
            f"Must be one of: {', '.join(valid_strategies)}"
        )
    
    # Validate output format
    valid_formats = ['excel', 'csv', 'pdf']
    if config.output_format not in valid_formats:
        raise ConfigurationError(
            f"Invalid output format: {config.output_format}. "
            f"Must be one of: {', '.join(valid_formats)}"
        )
    
    # Validate numeric values
    if config.max_retries < 0:
        raise ConfigurationError("max_retries must be >= 0")
    
    if config.retry_delay < 0:
        raise ConfigurationError("retry_delay must be >= 0")
    
    if config.timeout <= 0:
        raise ConfigurationError("timeout must be > 0")
    
    if config.min_username_length < 1:
        raise ConfigurationError("min_username_length must be >= 1")
    
    if config.max_username_length < config.min_username_length:
        raise ConfigurationError(
            "max_username_length must be >= min_username_length"
        )
