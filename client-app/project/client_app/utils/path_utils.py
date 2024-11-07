# project/client_app/utils/path_utils.py
"""Path manipulation utilities."""

import os
from typing import Dict, Any
from datetime import datetime
from werkzeug.utils import secure_filename
from .directory_utils import ensure_dir_exists

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