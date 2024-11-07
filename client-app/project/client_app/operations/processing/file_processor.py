# project/client_app/operations/processing/file_processor.py

import os
import time
import shutil
from typing import Dict, Any, Optional, Tuple
from flask import current_app
from ..metadata_handler import MetadataHandler
from ...file_utils import calculate_file_hash
from .core_processor import CoreProcessor
from .file_rename import FileRenameHandler
from .cleanup_handler import CleanupHandler
from .completion_handler import CompletionHandler

class FileProcessor:
    @staticmethod
    def ensure_dir_exists(directory: str) -> None:
        """Ensure directory exists, create if it doesn't."""
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)

    @staticmethod
    def safe_rename(src: str, dst: str, max_retries: int = 3) -> bool:
        """
        Safely rename a file with retries.
        Returns True if successful, False otherwise.
        """
        for attempt in range(max_retries):
            try:
                if os.path.exists(dst):
                    current_app.logger.warning(f"Destination already exists: {dst}")
                    return False
                    
                os.rename(src, dst)
                current_app.logger.info(f"Successfully renamed: {src} -> {dst}")
                return True
                
            except OSError as e:
                current_app.logger.warning(f"Rename attempt {attempt + 1} failed: {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(2)  # Wait before retry
                
        return False

    @classmethod
    def validate_upload(cls, filepath: str, metadata: dict) -> Tuple[bool, str]:
        """
        Validate upload requirements.
        Returns (is_valid, error_message)
        """
        if not os.path.exists(filepath):
            return False, f"File not found: {filepath}"
            
        if not metadata:
            return False, "Metadata is required"
            
        if not metadata.get('originalFileHash'):
            return False, "Original file hash is required"
            
        return True, ""

    @classmethod
    def process_completed_upload(cls, filepath: str, upload_folder: str, 
                               filename: str, metadata: dict) -> Dict[str, Any]:
        """
        Process completed file upload following exact sequence requirements.
        Handles all stages from initial verification through completion.
        """
        try:
            # Initial validation
            is_valid, error_msg = cls.validate_upload(filepath, metadata)
            if not is_valid:
                raise ValueError(error_msg)

            # 1. Create/update initial metadata
            metadata.update({
                'processingStarted': time.strftime('%Y-%m-%d %H:%M:%S'),
                'originalFilename': filename,
                'uploadFolder': upload_folder
            })
            MetadataHandler.save_metadata(metadata, upload_folder, filename)
            current_app.logger.info("Initial metadata created")

            # 2. Calculate original hash and verify
            current_app.logger.info(f"Calculating hash for file: {filepath}")
            original_hash = metadata['originalFileHash']  # From chunked upload
            file_size = os.path.getsize(filepath)

            # 3. Update metadata with file details
            metadata.update({
                'fileSize': file_size,
                'originalFileHash': original_hash,
                'timestampVerified': time.strftime('%Y-%m-%d %H:%M:%S')
            })
            MetadataHandler.save_metadata(metadata, upload_folder, filename)
            current_app.logger.info("Metadata updated with file details")

            # 4. Verify file integrity
            current_app.logger.info("Verifying file integrity")
            new_hash = calculate_file_hash(filepath)
            is_verified = new_hash == original_hash

            # 5. Update metadata with verification results
            metadata.update({
                'newFileHash': new_hash,
                'verified': is_verified,
                'integrityVerified': time.strftime('%Y-%m-%d %H:%M:%S')
            })
            MetadataHandler.save_metadata(metadata, upload_folder, filename)
            current_app.logger.info(f"File verification completed: {is_verified}")

            if not is_verified:
                raise ValueError("File integrity verification failed - hashes do not match")

            # 6. Handle file rename if requested
            if metadata.get('rename_file'):
                new_filename = metadata.get('new_filename')
                if new_filename:
                    current_app.logger.info(f"Renaming file to: {new_filename}")
                    new_filepath = os.path.join(upload_folder, new_filename)
                    
                    # Rename both file and metadata
                    if cls.safe_rename(filepath, new_filepath):
                        old_meta = os.path.join(upload_folder, f"{filename}_metadata.json")
                        new_meta = os.path.join(upload_folder, f"{new_filename}_metadata.json")
                        cls.safe_rename(old_meta, new_meta)
                        
                        filepath = new_filepath
                        filename = new_filename
                        metadata.update({
                            'newFilename': new_filename,
                            'currentFilename': new_filename
                        })
                        MetadataHandler.save_metadata(metadata, upload_folder, filename)
                        current_app.logger.info("File rename completed")
                    else:
                        raise OSError(f"Failed to rename file to {new_filename}")

            # 7. Add _complete suffix
            base_name, ext = os.path.splitext(filename)
            if not base_name.endswith('_complete'):
                complete_filename = f"{base_name}_complete{ext}"
                complete_filepath = os.path.join(upload_folder, complete_filename)
                
                current_app.logger.info(f"Adding completion suffix: {complete_filename}")
                
                if cls.safe_rename(filepath, complete_filepath):
                    # Rename metadata file
                    old_meta = os.path.join(upload_folder, f"{filename}_metadata.json")
                    new_meta = os.path.join(upload_folder, f"{complete_filename}_metadata.json")
                    cls.safe_rename(old_meta, new_meta)
                    
                    filepath = complete_filepath
                    filename = complete_filename
                    metadata.update({
                        'final_filename': complete_filename,
                        'currentFilename': complete_filename
                    })
                    MetadataHandler.save_metadata(metadata, upload_folder, filename)
                    current_app.logger.info("Completion suffix added")
                else:
                    raise OSError(f"Failed to add completion suffix")

            # 8. Final metadata update
            metadata.update({
                'processingCompleted': True,
                'completedAt': time.strftime('%Y-%m-%d %H:%M:%S')
            })
            MetadataHandler.save_metadata(metadata, upload_folder, filename)

            # 9. Return final status
            return {
                'status': 'success',
                'filePath': filepath,
                'originalFilename': metadata['originalFilename'],
                'newFilename': filename,
                'originalHash': original_hash,
                'newHash': new_hash,
                'fileSize': file_size,
                'verified': is_verified,
                'success': True,
                'metadata': metadata
            }

        except Exception as e:
            current_app.logger.error(f"Error in file processing: {str(e)}")
            
            try:
                # Update metadata with error
                metadata.update({
                    'processingError': str(e),
                    'processingCompleted': False,
                    'errorTimestamp': time.strftime('%Y-%m-%d %H:%M:%S')
                })
                MetadataHandler.save_metadata(metadata, upload_folder, filename)
                
                # Clean up failed upload
                CleanupHandler.cleanup_failed_upload(upload_folder, filename)
                
            except Exception as cleanup_error:
                current_app.logger.error(f"Error during cleanup: {str(cleanup_error)}")
            
            return {
                'status': 'File processing failed',
                'error': str(e),
                'filePath': filepath,
                'success': False
            }