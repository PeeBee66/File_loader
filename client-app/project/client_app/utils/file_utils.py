# project/client_app/utils/file_utils.py
"""File-related utility functions."""

import os
from typing import Optional, Dict, Any
from flask import current_app
from datetime import datetime
from werkzeug.utils import secure_filename
from .format_utils import format_file_size

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