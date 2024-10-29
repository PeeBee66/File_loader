# project/client_app/operations/file_processor.py

import os
from flask import current_app
from ..file_utils import calculate_file_hash, get_final_filename, verify_file_integrity
from .metadata_handler import MetadataHandler

class FileProcessor:
    @staticmethod
    def process_completed_upload(filepath: str, upload_folder: str, filename: str, metadata: dict) -> dict:
        """Process completed file upload"""
        try:
            current_app.logger.info("Starting final file processing")
            
            # Calculate original hash
            current_app.logger.info("Calculating original file hash...")
            original_hash = calculate_file_hash(filepath)
            metadata['originalFileHash'] = original_hash
            
            # Get final filename
            rename_checked = metadata.get('rename_file', False)
            rename_preview = metadata.get('new_filename', '')
            final_filename = get_final_filename(filename, rename_checked, rename_preview)
            
            # Setup final path
            final_path = os.path.join(upload_folder, final_filename)
            
            # Perform rename
            current_app.logger.info(f"Renaming file to: {final_filename}")
            os.rename(filepath, final_path)
            
            # Calculate final hash
            final_hash = calculate_file_hash(final_path)
            metadata['finalFileHash'] = final_hash
            
            # Verify hashes match
            if original_hash != final_hash:
                raise ValueError("File integrity check failed - hashes do not match")
            
            metadata['final_filename'] = final_filename
            metadata['file_verified'] = True
            
            # Update metadata file with new filename
            MetadataHandler.save_metadata(metadata, upload_folder, final_filename)
            
            # Return success response
            return {
                'status': 'File upload completed',
                'filePath': final_path,
                'metadata': metadata
            }
            
        except Exception as e:
            current_app.logger.error(f"Error in file processing: {str(e)}")
            raise