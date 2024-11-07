# project/client_app/operations/processing/completion_handler.py
"""Final processing steps and completion handling."""

import os
import time
from flask import current_app
from ..metadata_handler import MetadataHandler

class CompletionHandler:
    @classmethod
    def handle_completion(cls, filepath: str, filename: str, metadata: dict, 
                         upload_folder: str, original_hash: str) -> dict:
        """Handle final processing steps and completion."""
        try:
            # Update metadata with final information
            metadata.update({
                'final_filename': filename,
                'filePath': filepath,
                'originalFilename': os.path.basename(filepath),
                'newFilename': filename,
                'fileSize': os.path.getsize(filepath),
                'fileHash': original_hash,  # Use already verified hash
                'verified': True,  # We know it's verified from previous check
                'processingCompleted': True,
                'completedAt': time.strftime('%Y-%m-%d %H:%M:%S')
            })
            
            MetadataHandler.save_metadata(metadata, upload_folder, filename)
            
            return {
                'status': 'success',
                'filePath': filepath,
                'originalFilename': os.path.basename(filepath),
                'newFilename': filename,
                'originalHash': original_hash,
                'newHash': original_hash,  # Use same hash since file content hasn't changed
                'verified': True,
                'fileSize': metadata['fileSize'],
                'success': True,
                'metadata': metadata
            }
            
        except Exception as e:
            current_app.logger.error(f"Error in completion handling: {str(e)}")
            raise