# project/client_app/operations/file_operations.py

from flask import current_app, request
import json
import os
import sys
from threading import Lock
import time
from typing import Dict, Any, Optional
from ..utils import get_metadata_path, find_metadata_file, ensure_dir_exists
from ..file_utils import handle_file_processing
from .upload_handler import UploadHandler
from .metadata_handler import MetadataHandler
from .processing import FileProcessor

class FileOperations:
    _processing_lock = Lock()
    _active_uploads: Dict[str, Dict[str, Any]] = {}
    _chunk_locks: Dict[str, Lock] = {}
    
    @classmethod
    def _get_chunk_lock(cls, filepath: str) -> Lock:
        """Get or create a lock for a specific file."""
        if filepath not in cls._chunk_locks:
            cls._chunk_locks[filepath] = Lock()
        return cls._chunk_locks[filepath]

    @classmethod
    def _release_resources(cls, upload_id: str, filepath: Optional[str] = None):
        """Release all resources associated with an upload."""
        try:
            if upload_id in cls._active_uploads:
                cls._active_uploads.pop(upload_id)
            if filepath and filepath in cls._chunk_locks:
                cls._chunk_locks.pop(filepath)
        except Exception as e:
            current_app.logger.error(f"Error releasing resources: {str(e)}")

    @classmethod
    def _ensure_upload_dir(cls, filepath: str) -> None:
        """Ensure the upload directory exists."""
        try:
            directory = os.path.dirname(filepath)
            if not os.path.exists(directory):
                ensure_dir_exists(directory)
                current_app.logger.info(f"Created directory: {directory}")
        except Exception as e:
            current_app.logger.error(f"Error creating directory: {str(e)}")
            raise

    @classmethod
    def _write_chunk_safely(cls, file_path: str, chunk_data: bytes, chunk_number: int, chunk_size: int = None) -> bool:
        """Write chunk data to file with proper error handling and initial file creation."""
        max_retries = 3
        retry_delay = 1
        temp_path = f"{file_path}.tmp{chunk_number}"
        
        try:
            # Ensure directory exists
            cls._ensure_upload_dir(file_path)
            
            # For first chunk, create the file if it doesn't exist
            if chunk_number == 0 and not os.path.exists(file_path):
                open(file_path, 'wb').close()
                current_app.logger.info(f"Created initial file: {file_path}")

            for attempt in range(max_retries):
                try:
                    # Write chunk to temporary file
                    with open(temp_path, 'wb') as temp_file:
                        temp_file.write(chunk_data)
                        temp_file.flush()
                        os.fsync(temp_file.fileno())

                    # Write to main file
                    with open(file_path, 'r+b') as main_file:
                        # Set position for this chunk
                        if chunk_size is not None:
                            position = chunk_number * chunk_size
                            main_file.seek(position)
                        else:
                            main_file.seek(0, 2)  # Seek to end for append

                        # Read from temp and write to main
                        with open(temp_path, 'rb') as temp_file:
                            main_file.write(temp_file.read())
                        
                        main_file.flush()
                        os.fsync(main_file.fileno())

                    # Success - remove temp file and return
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                    return True

                except (IOError, OSError) as e:
                    current_app.logger.warning(f"Write attempt {attempt + 1} failed: {str(e)}")
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                        retry_delay *= 2
                    else:
                        current_app.logger.error(f"Failed to write chunk after {max_retries} attempts")
                        raise

            return False

        except Exception as e:
            current_app.logger.error(f"Error writing chunk: {str(e)}")
            # Clean up temp file if it exists
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except:
                    pass
            raise

    @classmethod
    def process_chunk(cls, file, chunk: int, total_chunks: int, chunk_size: int, 
                     filename: str, base_upload_folder: str) -> Dict[str, Any]:
        """Handle file chunk processing with improved error handling."""
        if not base_upload_folder:
            raise ValueError("UPLOAD_FOLDER not set in configuration")

        upload_id = f"{filename}_{total_chunks}"
        
        with cls._processing_lock:
            try:
                # Initialize new upload
                if chunk == 0:
                    current_app.logger.info(f"Initializing new upload for {filename}")
                    if upload_id in cls._active_uploads:
                        current_app.logger.warning(f"Clearing existing upload state for {filename}")
                        cls._release_resources(upload_id)
                    
                    metadata_str = request.form.get('metadata')
                    if not metadata_str:
                        raise ValueError("Missing metadata for initial chunk")
                        
                    try:
                        metadata = json.loads(metadata_str)
                    except json.JSONDecodeError as e:
                        current_app.logger.error(f"Invalid metadata JSON: {metadata_str}")
                        raise ValueError(f"Invalid metadata format: {str(e)}")
                        
                    folder_name = metadata.get('folder_name', '')
                    upload_folder = UploadHandler.create_upload_folder(base_upload_folder, folder_name)
                    metadata['upload_folder'] = upload_folder
                    
                    cls._active_uploads[upload_id] = {
                        'chunks_received': set(),
                        'metadata': metadata,
                        'upload_folder': upload_folder,
                        'last_chunk_time': time.time()
                    }
                    
                    MetadataHandler.save_metadata(metadata, upload_folder, filename)
                else:
                    # Verify upload exists and hasn't timed out
                    if upload_id not in cls._active_uploads:
                        raise ValueError("Upload not properly initialized")
                    
                    if time.time() - cls._active_uploads[upload_id]['last_chunk_time'] > 300:
                        cls._release_resources(upload_id)
                        raise ValueError("Upload timeout - session expired")
                    
                    metadata = cls._active_uploads[upload_id]['metadata']
                    upload_folder = cls._active_uploads[upload_id]['upload_folder']

                # Check for duplicate chunks
                if chunk in cls._active_uploads[upload_id]['chunks_received']:
                    current_app.logger.warning(f"Duplicate chunk received: {chunk}/{total_chunks}")
                    return {'status': 'Chunk already processed'}

                filepath = os.path.join(upload_folder, filename)
                chunk_lock = cls._get_chunk_lock(filepath)

                with chunk_lock:
                    current_app.logger.info(f"Processing chunk {chunk+1}/{total_chunks} for file {filename}")
                    
                    # Read chunk data
                    chunk_data = file.read()
                    
                    # Write chunk safely with retries
                    if not cls._write_chunk_safely(filepath, chunk_data, chunk, chunk_size):
                        raise IOError(f"Failed to write chunk {chunk+1}/{total_chunks}")

                    # Update upload state
                    cls._active_uploads[upload_id]['chunks_received'].add(chunk)
                    cls._active_uploads[upload_id]['last_chunk_time'] = time.time()

                # Process final chunk
                if chunk == total_chunks - 1 and len(cls._active_uploads[upload_id]['chunks_received']) == total_chunks:
                    try:
                        result = FileProcessor.process_completed_upload(
                            filepath, upload_folder, filename, metadata
                        )
                        cls._release_resources(upload_id, filepath)
                        return result
                    except Exception as e:
                        current_app.logger.error(f"Error in final processing: {str(e)}")
                        cls._release_resources(upload_id, filepath)
                        raise

                return {'status': 'Chunk received'}

            except Exception as e:
                current_app.logger.error(f"Error processing chunk: {str(e)}")
                cls._release_resources(upload_id)
                raise