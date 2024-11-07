# project/client_app/file_utils/hash_utils.py
"""Utilities for file hashing and verification."""

import os
import hashlib
from flask import current_app

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