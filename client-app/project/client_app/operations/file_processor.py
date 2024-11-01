# project/client_app/operations/file_processor.py

from flask import current_app
import os
import time
from threading import Lock
from ..file_utils import calculate_file_hash
from .metadata_handler import MetadataHandler

class FileProcessor:
    _processing_lock = Lock()

    @classmethod
    def process_completed_upload(cls, filepath: str, upload_folder: str, filename: str, metadata: dict) -> dict:
        """Process completed file upload with synchronized operations and specified delays"""
        
        with cls._processing_lock:
            try:
                # Step 1: Verify we have the original hash from client
                current_app.logger.info("Step 1: Verifying original hash exists in metadata...")
                if not metadata.get('originalFileHash'):
                    raise ValueError("Original file hash missing from metadata")
                original_hash = metadata['originalFileHash']
                
                # Step 6: Calculate hash of uploaded file
                current_app.logger.info("Step 6: Calculating hash of uploaded file...")
                current_app.logger.info(f"Calculating hash for file: {filepath}")
                final_hash = calculate_file_hash(filepath)
                current_app.logger.info(f"Hash calculation complete: {final_hash}")
                time.sleep(2)  # Wait after hash calculation
                
                # Step 7: Update metadata with new hash
                current_app.logger.info("Step 7: Updating metadata with new hash...")
                metadata['fileHash'] = final_hash
                MetadataHandler.save_metadata(metadata, upload_folder, filename)
                time.sleep(2)  # Wait after metadata update
                
                # Step 8: Update verification status
                current_app.logger.info("Step 8: Updating verification status...")
                metadata['verified'] = original_hash == final_hash
                current_app.logger.info(f"File verification status: {metadata['verified']}")
                MetadataHandler.save_metadata(metadata, upload_folder, filename)
                time.sleep(2)  # Wait after verification update
                
                # Step 9: Handle rename if requested
                final_filename = filename
                if metadata.get('rename_file'):
                    new_filename = metadata.get('new_filename')
                    if new_filename:
                        current_app.logger.info(f"Step 9: Attempting to rename file to: {new_filename}")
                        
                        for attempt in range(3):  # 3 attempts with 5 second delays
                            try:
                                new_filepath = os.path.join(upload_folder, new_filename)
                                
                                # Ensure no process is using the file
                                if os.path.exists(new_filepath):
                                    raise OSError(f"Destination file already exists: {new_filepath}")
                                
                                os.rename(filepath, new_filepath)
                                filepath = new_filepath
                                
                                # Rename metadata file
                                old_metadata_path = os.path.join(upload_folder, f"{filename}_metadata.json")
                                new_metadata_path = os.path.join(upload_folder, f"{new_filename}_metadata.json")
                                
                                if os.path.exists(old_metadata_path):
                                    os.rename(old_metadata_path, new_metadata_path)
                                
                                final_filename = new_filename
                                metadata['filePath'] = new_filepath
                                MetadataHandler.save_metadata(metadata, upload_folder, new_filename)
                                current_app.logger.info("File rename successful")
                                break
                            
                            except OSError as e:
                                current_app.logger.error(f"Rename attempt {attempt + 1} failed: {str(e)}")
                                if attempt == 2:  # Last attempt failed
                                    raise
                                time.sleep(5)  # Wait 5 seconds before retry
                        
                        time.sleep(2)  # Wait after successful rename
                
                # Step 10: Add '_complete' suffix
                base_name, ext = os.path.splitext(final_filename)
                complete_filename = f"{base_name}_complete{ext}"
                complete_filepath = os.path.join(upload_folder, complete_filename)
                
                # Attempt rename with retries
                for attempt in range(3):
                    try:
                        if os.path.exists(complete_filepath):
                            raise OSError(f"Complete file already exists: {complete_filepath}")
                        
                        os.rename(filepath, complete_filepath)
                        
                        # Rename metadata file
                        old_metadata_path = os.path.join(upload_folder, f"{final_filename}_metadata.json")
                        new_metadata_path = os.path.join(upload_folder, f"{complete_filename}_metadata.json")
                        
                        if os.path.exists(old_metadata_path):
                            os.rename(old_metadata_path, new_metadata_path)
                        break
                    
                    except OSError as e:
                        current_app.logger.error(f"Complete suffix rename attempt {attempt + 1} failed: {str(e)}")
                        if attempt == 2:  # Last attempt failed
                            raise
                        time.sleep(5)  # Wait 5 seconds before retry
                
                time.sleep(2)  # Wait after adding complete suffix
                
                # Final metadata update
                metadata.update({
                    'final_filename': complete_filename,
                    'filePath': complete_filepath,
                    'originalFilename': filename,
                    'newFilename': complete_filename,
                    'fileSize': os.path.getsize(complete_filepath),
                    'processingCompleted': True,
                    'completedAt': time.strftime('%Y-%m-%d %H:%M:%S')
                })
                
                MetadataHandler.save_metadata(metadata, upload_folder, complete_filename)
                
                current_app.logger.info("File processing completed successfully")
                
                return {
                    'status': 'success',
                    'filePath': complete_filepath,
                    'originalFilename': filename,
                    'newFilename': complete_filename,
                    'originalHash': original_hash,
                    'newHash': final_hash,
                    'verified': metadata['verified'],
                    'fileSize': metadata['fileSize'],
                    'success': True,
                    'metadata': metadata
                }
                
            except Exception as e:
                current_app.logger.error(f"Error in file processing: {str(e)}")
                
                # Attempt to save error to metadata if possible
                try:
                    if metadata and upload_folder and filename:
                        metadata['processingError'] = str(e)
                        metadata['processingCompleted'] = False
                        MetadataHandler.save_metadata(metadata, upload_folder, filename)
                except Exception as metadata_error:
                    current_app.logger.error(f"Failed to save error to metadata: {str(metadata_error)}")
                
                return {
                    'status': 'File processing failed',
                    'error': str(e),
                    'filePath': filepath,
                    'success': False
                }

    @classmethod
    def cleanup_failed_upload(cls, upload_folder: str, filename: str) -> None:
        """Clean up files from a failed upload"""
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

    @classmethod
    def verify_file_integrity(cls, filepath: str, original_hash: str) -> bool:
        """
        Verify the integrity of a file by comparing its hash with the original hash.
        
        Args:
            filepath (str): Path to the file to verify
            original_hash (str): Original hash to compare against
            
        Returns:
            bool: True if hashes match, False otherwise
        """
        try:
            current_app.logger.info(f"Verifying file integrity: {filepath}")
            calculated_hash = calculate_file_hash(filepath)
            is_valid = calculated_hash == original_hash
            current_app.logger.info(f"File integrity verification result: {is_valid}")
            return is_valid
        except Exception as e:
            current_app.logger.error(f"Error verifying file integrity: {str(e)}")
            return False

    @classmethod
    def handle_rename_operation(cls, 
                              current_path: str, 
                              new_path: str, 
                              metadata_path: str = None, 
                              new_metadata_path: str = None) -> bool:
        """
        Handle file rename operation with retries and metadata update.
        
        Args:
            current_path (str): Current file path
            new_path (str): New file path
            metadata_path (str, optional): Current metadata file path
            new_metadata_path (str, optional): New metadata file path
            
        Returns:
            bool: True if rename successful, False otherwise
        """
        for attempt in range(3):
            try:
                # Ensure destination doesn't exist
                if os.path.exists(new_path):
                    raise OSError(f"Destination file already exists: {new_path}")
                
                # Rename main file
                os.rename(current_path, new_path)
                
                # Rename metadata file if paths provided
                if metadata_path and new_metadata_path and os.path.exists(metadata_path):
                    os.rename(metadata_path, new_metadata_path)
                
                return True
                
            except OSError as e:
                current_app.logger.error(f"Rename attempt {attempt + 1} failed: {str(e)}")
                if attempt == 2:  # Last attempt failed
                    return False
                time.sleep(5)  # Wait 5 seconds before retry
        
        return False

    @classmethod
    def update_metadata_with_error(cls, metadata: dict, error_message: str, 
                                 upload_folder: str, filename: str) -> None:
        """
        Update metadata file with error information.
        
        Args:
            metadata (dict): Current metadata dictionary
            error_message (str): Error message to add
            upload_folder (str): Folder containing metadata file
            filename (str): Name of the file being processed
        """
        try:
            metadata['processingError'] = error_message
            metadata['processingCompleted'] = False
            metadata['errorTimestamp'] = time.strftime('%Y-%m-%d %H:%M:%S')
            MetadataHandler.save_metadata(metadata, upload_folder, filename)
        except Exception as e:
            current_app.logger.error(f"Failed to update metadata with error: {str(e)}")

    @classmethod
    def validate_processing_requirements(cls, filepath: str, metadata: dict) -> None:
        """
        Validate all requirements for file processing.
        
        Args:
            filepath (str): Path to the file being processed
            metadata (dict): Metadata dictionary
            
        Raises:
            ValueError: If any validation fails
        """
        if not os.path.exists(filepath):
            raise ValueError(f"File not found: {filepath}")
            
        if not metadata:
            raise ValueError("Metadata is required for processing")
            
        if not metadata.get('originalFileHash'):
            raise ValueError("Original file hash is required in metadata")
            
        if not os.path.exists(os.path.dirname(filepath)):
            raise ValueError(f"Upload folder not found: {os.path.dirname(filepath)}")

    @classmethod
    def get_processing_status(cls, upload_folder: str, filename: str) -> dict:
        """
        Get current processing status from metadata.
        
        Args:
            upload_folder (str): Folder containing metadata file
            filename (str): Name of the file being processed
            
        Returns:
            dict: Current processing status
        """
        try:
            metadata = MetadataHandler.load_metadata(upload_folder, filename)
            return {
                'completed': metadata.get('processingCompleted', False),
                'error': metadata.get('processingError'),
                'verified': metadata.get('verified', False),
                'originalHash': metadata.get('originalFileHash'),
                'newHash': metadata.get('fileHash'),
                'finalFilename': metadata.get('final_filename'),
                'status': 'error' if metadata.get('processingError') else 
                         'completed' if metadata.get('processingCompleted') else 
                         'processing'
            }
        except Exception as e:
            current_app.logger.error(f"Error getting processing status: {str(e)}")
            return {
                'status': 'error',
                'error': str(e)
            }