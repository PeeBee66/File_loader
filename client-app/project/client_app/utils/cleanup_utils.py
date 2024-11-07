# project/client_app/utils/cleanup_utils.py
"""Cleanup utility functions."""

import os
from datetime import datetime
from flask import current_app

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