# project/client_app/file_utils.py

"""
File utility functions for handling file operations, hashing, and verification.
"""

import os
import hashlib
from typing import Tuple, Dict
from flask import current_app
from werkzeug.utils import secure_filename

def calculate_file_hash(filepath: str, chunk_size: int = 8192) -> str:
    """
    Calculate MD5 hash of a file in chunks with enhanced progress tracking
    """
    md5_hash = hashlib.md5()
    total_size = os.path.getsize(filepath)
    bytes_processed = 0
    last_progress = 0
    
    current_app.logger.info(f"Starting MD5 hash calculation for file: {filepath}")
    
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(chunk_size), b""):
            md5_hash.update(byte_block)
            bytes_processed += len(byte_block)
            
            # Calculate progress percentage
            progress = int((bytes_processed / total_size) * 100)
            
            # Log progress every 5% change
            if progress >= last_progress + 5:
                current_app.logger.info(f"Hash calculation progress: {progress}%")
                last_progress = progress
                
    hash_result = md5_hash.hexdigest()
    current_app.logger.info(f"MD5 hash calculation completed: {hash_result}")
    return hash_result

def check_existing_file(filepath: str) -> bool:
    """
    Check if a file already exists at the given path.
    
    Args:
        filepath (str): Path to check
        
    Returns:
        bool: True if file exists, False otherwise
    """
    return os.path.exists(filepath)

def get_final_filename(original_filename: str, rename_checked: bool, rename_preview: str) -> str:
    """
    Determine the final filename based on rename settings.
    
    Args:
        original_filename (str): Original file name
        rename_checked (bool): Whether rename option is checked
        rename_preview (str): Preview of new filename if rename is checked
        
    Returns:
        str: Final filename to use
    """
    if rename_checked and rename_preview:
        base, ext = os.path.splitext(rename_preview)
        return f"{base}_complete{ext}"
    else:
        base, ext = os.path.splitext(original_filename)
        return f"{base}_complete{ext}"

def handle_file_processing(
    filepath: str,
    final_path: str,
    metadata: Dict,
    rename_checked: bool = False,
    rename_preview: str = ""
) -> Tuple[bool, str, Dict]:
    """
    Process file with integrity checks and proper renaming.
    
    Args:
        filepath (str): Path to the current file
        final_path (str): Path where the file should end up
        metadata (Dict): File metadata dictionary
        rename_checked (bool): Whether rename option is checked
        rename_preview (str): Preview of new filename if rename is checked
        
    Returns:
        Tuple[bool, str, Dict]: (success, error_message, updated_metadata)
    """
    try:
        current_app.logger.info(f"Starting file processing for: {filepath}")

        if not os.path.exists(filepath):
            return False, f"Source file not found: {filepath}", metadata

        current_app.logger.info("Calculating original file hash...")
        original_hash = calculate_file_hash(filepath)
        metadata['originalFileHash'] = original_hash
        current_app.logger.info(f"Original file hash: {original_hash}")

        final_filename = get_final_filename(
            os.path.basename(filepath),
            rename_checked,
            rename_preview
        )
        
        final_path = os.path.join(os.path.dirname(final_path), final_filename)

        if os.path.exists(final_path):
            return False, f"Destination file already exists: {final_filename}", metadata

        current_app.logger.info(f"Renaming file to: {final_filename}")
        
        try:
            os.rename(filepath, final_path)
        except OSError as e:
            return False, f"Error renaming file: {str(e)}", metadata

        current_app.logger.info("Calculating final file hash...")
        final_hash = calculate_file_hash(final_path)
        metadata['finalFileHash'] = final_hash
        current_app.logger.info(f"Final file hash: {final_hash}")

        if original_hash != final_hash:
            current_app.logger.error("Hash mismatch detected!")
            try:
                os.rename(final_path, filepath)
            except OSError:
                pass
            return False, "File integrity check failed - hashes do not match", metadata

        metadata['final_filename'] = final_filename
        metadata['file_verified'] = True

        current_app.logger.info("File processing completed successfully")
        return True, "", metadata

    except Exception as e:
        current_app.logger.error(f"Error in handle_file_processing: {str(e)}")
        return False, f"Error processing file: {str(e)}", metadata

def verify_file_integrity(src_hash: str, dst_path: str) -> bool:
    """
    Verify file integrity by comparing hashes.
    
    Args:
        src_hash (str): Original file hash
        dst_path (str): Path to the file to verify
        
    Returns:
        bool: True if hashes match, False otherwise
    """
    try:
        dst_hash = calculate_file_hash(dst_path)
        return src_hash == dst_hash
    except Exception as e:
        current_app.logger.error(f"Error verifying file integrity: {str(e)}")
        return False

def get_file_size(filepath: str) -> int:
    """
    Get file size in bytes.
    
    Args:
        filepath (str): Path to the file
        
    Returns:
        int: File size in bytes
    """
    try:
        return os.path.getsize(filepath)
    except OSError as e:
        current_app.logger.error(f"Failed to get file size for {filepath}: {str(e)}")
        raise

def clean_directory(directory: str, exclude_files: list = None) -> None:
    """Clean a directory with enhanced error handling"""
    exclude_files = exclude_files or []
    try:
        for filename in os.listdir(directory):
            if filename not in exclude_files:
                filepath = os.path.join(directory, filename)
                if os.path.isfile(filepath):
                    try:
                        os.remove(filepath)
                        current_app.logger.info(f"Removed file: {filepath}")
                    except PermissionError:
                        current_app.logger.warning(f"Permission denied when trying to remove: {filepath}")
                        # Wait briefly and try again
                        time.sleep(1)
                        try:
                            os.remove(filepath)
                            current_app.logger.info(f"Successfully removed file on second attempt: {filepath}")
                        except Exception as e:
                            current_app.logger.error(f"Failed to remove file even after retry: {filepath}, Error: {str(e)}")
    except Exception as e:
        current_app.logger.error(f"Failed to clean directory {directory}: {str(e)}")
        raise

def is_valid_file_type(filename: str, allowed_extensions: list = None) -> bool:
    """
    Check if file has an allowed extension.
    
    Args:
        filename (str): Name of the file to check
        allowed_extensions (list): List of allowed extensions
        
    Returns:
        bool: True if file type is allowed, False otherwise
    """
    if not allowed_extensions:
        allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', [])
    
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

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