# project/client_app/operations/processing/cleanup_handler.py
"""Cleanup operations for failed uploads."""

import os
from flask import current_app

class CleanupHandler:
    @classmethod
    def cleanup_failed_upload(cls, upload_folder: str, filename: str) -> None:
        """Clean up files from a failed upload."""
        try:
            filepath = os.path.join(upload_folder, filename)
            metadata_path = os.path.join(upload_folder, f"{filename}_metadata.json")
            
            # Remove the main file if it exists
            if os.path.exists(filepath):
                os.remove(filepath)
                current_app.logger.info(f"Removed failed upload file: {filepath}")
            
            # Remove the metadata file if it exists
            if os.path.exists(metadata_path):
                os.remove(metadata_path)
                current_app.logger.info(f"Removed failed upload metadata: {metadata_path}")
            
            # Remove the folder if it's empty
            if os.path.exists(upload_folder) and not os.listdir(upload_folder):
                os.rmdir(upload_folder)
                current_app.logger.info(f"Removed empty upload folder: {upload_folder}")
                
        except Exception as e:
            current_app.logger.error(f"Error cleaning up failed upload: {str(e)}")
            raise
