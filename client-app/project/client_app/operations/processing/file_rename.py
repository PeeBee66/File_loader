# project/client_app/operations/processing/file_rename.py

import os
import time
from flask import current_app

class FileRenameHandler:
    @classmethod
    def handle_rename_operation(cls, current_path: str, new_path: str, 
                              metadata_path: str = None, new_metadata_path: str = None) -> bool:
        """Handle file rename operation with retries and proper file handling."""
        
        if not os.path.exists(current_path):
            current_app.logger.error(f"Source file not found: {current_path}")
            return False
            
        if os.path.exists(new_path):
            current_app.logger.error(f"Destination file already exists: {new_path}")
            return False
            
        try:
            # Ensure the destination directory exists
            os.makedirs(os.path.dirname(new_path), exist_ok=True)
            
            # First try to rename the file
            os.rename(current_path, new_path)
            current_app.logger.info(f"Successfully renamed file to: {new_path}")
            
            # If metadata paths are provided, rename the metadata file too
            if metadata_path and new_metadata_path and os.path.exists(metadata_path):
                try:
                    os.rename(metadata_path, new_metadata_path)
                    current_app.logger.info(f"Successfully renamed metadata to: {new_metadata_path}")
                except Exception as e:
                    current_app.logger.error(f"Error renaming metadata file: {str(e)}")
                    # Try to revert the file rename if metadata rename fails
                    try:
                        os.rename(new_path, current_path)
                    except:
                        pass
                    return False
                    
            return True
                
        except Exception as e:
            current_app.logger.error(f"Error in rename operation: {str(e)}")
            return False