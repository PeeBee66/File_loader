# project/client_app/utils/directory_utils.py
"""Directory manipulation utilities."""

import os
from flask import current_app

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

def is_path_secure(path: str, base_path: str) -> bool:
    """
    Check if a path is secure (doesn't escape base path).
    
    Args:
        path (str): Path to check
        base_path (str): Base path that should contain the path
        
    Returns:
        bool: True if path is secure, False otherwise
    """
    try:
        resolved_path = os.path.realpath(path)
        resolved_base = os.path.realpath(base_path)
        return resolved_path.startswith(resolved_base)
    except Exception as e:
        current_app.logger.error(f"Error checking path security: {str(e)}")
        return False

def create_folder_structure(base_folder: str, subfolder: str) -> str:
    """
    Create a folder structure and return the path.
    
    Args:
        base_folder (str): Base folder path
        subfolder (str): Subfolder name or path
        
    Returns:
        str: Complete folder path
    """
    folder_path = os.path.join(base_folder, subfolder)
    ensure_dir_exists(folder_path)
    return folder_path