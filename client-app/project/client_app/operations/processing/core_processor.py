# project/client_app/operations/processing/core_processor.py
"""Core file processing functionality."""

from flask import current_app
import os
import time
from threading import Lock
from ..metadata_handler import MetadataHandler
from ...file_utils import calculate_file_hash

class CoreProcessor:
    _processing_lock = Lock()

    @classmethod
    def validate_processing_requirements(cls, filepath: str, metadata: dict) -> None:
        """Validate all requirements for file processing."""
        if not os.path.exists(filepath):
            raise ValueError(f"File not found: {filepath}")
            
        if not metadata:
            raise ValueError("Metadata is required for processing")
            
        if not metadata.get('originalFileHash'):
            raise ValueError("Original file hash is required in metadata")
            
        if not os.path.exists(os.path.dirname(filepath)):
            raise ValueError(f"Upload folder not found: {os.path.dirname(filepath)}")

    @classmethod
    def calculate_file_hash(cls, filepath: str) -> str:
        """Calculate hash of the given file."""
        try:
            current_app.logger.info(f"Calculating hash for file: {filepath}")
            file_hash = calculate_file_hash(filepath)
            current_app.logger.info(f"Hash calculation complete: {file_hash}")
            return file_hash
        except Exception as e:
            current_app.logger.error(f"Error calculating file hash: {str(e)}")
            raise

    @classmethod
    def verify_file_integrity(cls, filepath: str, original_hash: str) -> bool:
        """Verify the integrity of a file by comparing its hash."""
        try:
            current_app.logger.info(f"Verifying file integrity: {filepath}")
            calculated_hash = cls.calculate_file_hash(filepath)
            is_valid = calculated_hash == original_hash
            current_app.logger.info(f"File integrity verification result: {is_valid}")
            return is_valid
        except Exception as e:
            current_app.logger.error(f"Error verifying file integrity: {str(e)}")
            return False

    @classmethod
    def update_metadata_with_error(cls, metadata: dict, error_message: str, 
                                 upload_folder: str, filename: str) -> None:
        """Update metadata file with error information."""
        try:
            metadata.update({
                'processingError': error_message,
                'processingCompleted': False,
                'errorTimestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                'fileVerified': False
            })
            MetadataHandler.save_metadata(metadata, upload_folder, filename)
        except Exception as e:
            current_app.logger.error(f"Failed to update metadata with error: {str(e)}")

    @classmethod
    def process_completed_file(cls, filepath: str, original_hash: str, 
                             metadata: dict, upload_folder: str) -> dict:
        """Process a completed file upload."""
        try:
            # Calculate final hash
            final_hash = cls.calculate_file_hash(filepath)
            
            # Verify integrity
            is_verified = final_hash == original_hash
            
            # Update metadata
            metadata.update({
                'finalFileHash': final_hash,
                'fileVerified': is_verified,
                'processingCompleted': True,
                'completedAt': time.strftime('%Y-%m-%d %H:%M:%S'),
                'fileSize': os.path.getsize(filepath)
            })
            
            MetadataHandler.save_metadata(metadata, upload_folder, os.path.basename(filepath))
            
            return {
                'success': True,
                'verified': is_verified,
                'originalHash': original_hash,
                'finalHash': final_hash,
                'filePath': filepath,
                'metadata': metadata
            }
            
        except Exception as e:
            error_msg = f"Error processing completed file: {str(e)}"
            current_app.logger.error(error_msg)
            cls.update_metadata_with_error(metadata, error_msg, upload_folder, os.path.basename(filepath))
            raise