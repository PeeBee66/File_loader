# project/client_app/utils.py

"""
General utility functions for the client application.
"""

import os
from typing import Optional, Dict, Any
from flask import current_app
from datetime import datetime
from werkzeug.utils import secure_filename

def ensure_dir_exists(directory: str) -> None:
    """
    Ensure a directory exists, create it if it doesn't.
    
    Args:
        directory (str): Path to the directory
    
    Raises:
        OSError: If directory creation fails due to permissions or disk space
    """
    try:
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            current_app.logger.info(f"Created directory: {directory}")
    except OSError as e:
        current_app.logger.error(f"Failed to create directory {directory}: {str(e)}")
        raise

def get_temp_dir() -> str:
    """
    Get the temporary directory path, create if it doesn't exist.
    
    Returns:
        str: Path to temporary directory
    
    Raises:
        ValueError: If UPLOAD_FOLDER is not configured
    """
    if not current_app.config.get('UPLOAD_FOLDER'):
        raise ValueError("UPLOAD_FOLDER not configured in application settings")
    
    temp_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'temp')
    ensure_dir_exists(temp_dir)
    return temp_dir

def get_metadata_path(upload_folder: str, filename: str) -> str:
    """
    Get the path for a metadata file.
    
    Args:
        upload_folder (str): Base upload folder path
        filename (str): Original filename
        
    Returns:
        str: Full path to metadata file
    """
    return os.path.join(upload_folder, f"{filename}_metadata.json")

def find_metadata_file(base_folder: str, filename: str) -> Optional[str]:
    """
    Find a metadata file in the base folder and its subdirectories.
    
    Args:
        base_folder (str): Base folder to search in
        filename (str): Original filename
        
    Returns:
        Optional[str]: Path to metadata file if found, None otherwise
    """
    metadata_filename = f"{filename}_metadata.json"
    for root, _, files in os.walk(base_folder):
        if metadata_filename in files:
            return os.path.join(root, metadata_filename)
    return None

def generate_unique_filename(original_filename: str, prefix: str = "") -> str:
    """
    Generate a unique filename with timestamp.
    
    Args:
        original_filename (str): Original file name
        prefix (str): Optional prefix to add to filename
        
    Returns:
        str: Unique filename
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base, ext = os.path.splitext(secure_filename(original_filename))
    if prefix:
        return f"{prefix}_{base}_{timestamp}{ext}"
    return f"{base}_{timestamp}{ext}"