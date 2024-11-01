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

def get_folder_path(base_folder: str, metadata: Dict[str, Any]) -> str:
    """
    Generate folder path based on metadata.
    
    Args:
        base_folder (str): Base folder path
        metadata (Dict[str, Any]): File metadata
        
    Returns:
        str: Complete folder path
    """
    folder_name = metadata.get('folder_name', datetime.now().strftime("%Y%m%d_%H%M%S"))
    folder_path = os.path.join(base_folder, folder_name)
    ensure_dir_exists(folder_path)
    return folder_path

def clean_filename(filename: str) -> str:
    """
    Clean and secure a filename.
    
    Args:
        filename (str): Original filename
        
    Returns:
        str: Cleaned and secured filename
    """
    return secure_filename(filename)

def get_file_extension(filename: str) -> str:
    """
    Get the file extension.
    
    Args:
        filename (str): Filename to process
        
    Returns:
        str: File extension including the dot
    """
    return os.path.splitext(filename)[1].lower()

def format_file_size(size_in_bytes: int) -> str:
    """
    Format file size in human-readable format.
    
    Args:
        size_in_bytes (int): File size in bytes
        
    Returns:
        str: Formatted file size string (e.g., "1.5 MB")
    """
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_in_bytes < 1024.0:
            return f"{size_in_bytes:.2f} {unit}"
        size_in_bytes /= 1024.0
    return f"{size_in_bytes:.2f} PB"

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

def get_file_info(filepath: str) -> Dict[str, Any]:
    """
    Get detailed file information.
    
    Args:
        filepath (str): Path to the file
        
    Returns:
        Dict[str, Any]: Dictionary containing file information
    """
    try:
        stat = os.stat(filepath)
        return {
            'size': stat.st_size,
            'created': datetime.fromtimestamp(stat.st_ctime).strftime('%Y-%m-%d %H:%M:%S'),
            'modified': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
            'filename': os.path.basename(filepath),
            'extension': get_file_extension(filepath),
            'path': filepath,
            'formatted_size': format_file_size(stat.st_size)
        }
    except Exception as e:
        current_app.logger.error(f"Error getting file info: {str(e)}")
        return {}

def clean_temp_files(temp_dir: str, max_age_hours: int = 24) -> None:
    """
    Clean up old temporary files.
    
    Args:
        temp_dir (str): Temporary directory path
        max_age_hours (int): Maximum age of files in hours before deletion
    """
    try:
        if not os.path.exists(temp_dir):
            return

        current_time = datetime.now().timestamp()
        max_age_seconds = max_age_hours * 3600

        for filename in os.listdir(temp_dir):
            filepath = os.path.join(temp_dir, filename)
            if os.path.isfile(filepath):
                file_modified = os.path.getmtime(filepath)
                if current_time - file_modified > max_age_seconds:
                    try:
                        os.remove(filepath)
                        current_app.logger.info(f"Cleaned up old temp file: {filepath}")
                    except OSError as e:
                        current_app.logger.error(f"Error deleting temp file {filepath}: {str(e)}")

    except Exception as e:
        current_app.logger.error(f"Error cleaning temp files: {str(e)}")