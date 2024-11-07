# project/client_app/utils/format_utils.py
"""Formatting utility functions."""

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