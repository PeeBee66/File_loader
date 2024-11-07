# project/client_app/file_utils/__init__.py
"""File utilities package providing file operation capabilities."""

from .hash_utils import calculate_file_hash, verify_file_integrity
from .file_handlers import (
    check_existing_file,
    get_final_filename,
    handle_file_processing,
    get_file_size,
    clean_directory,
    is_valid_file_type,
    format_file_size
)

__all__ = [
    'calculate_file_hash',
    'verify_file_integrity',
    'check_existing_file',
    'get_final_filename',
    'handle_file_processing',
    'get_file_size',
    'clean_directory',
    'is_valid_file_type',
    'format_file_size'
]