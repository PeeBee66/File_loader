# project/client_app/operations/file_operations.py

from flask import current_app, request
import json
import os
from threading import Lock
from ..utils import get_metadata_path, find_metadata_file
from ..file_utils import handle_file_processing
from .upload_handler import UploadHandler
from .metadata_handler import MetadataHandler
from .file_processor import FileProcessor

class FileOperations:
    _processing_lock = Lock()  # Add lock at class level
    _active_uploads = {}

    @classmethod
    def process_chunk(cls, file, chunk, total_chunks, chunk_size, filename, base_upload_folder):
        """Handle file chunk processing with synchronization"""
        if not base_upload_folder:
            raise ValueError("UPLOAD_FOLDER not set in configuration")

        upload_id = f"{filename}_{total_chunks}"
        
        with cls._processing_lock:
            try:
                if chunk == 0:
                    if upload_id in cls._active_uploads:
                        current_app.logger.warning(f"Clearing existing upload state for {filename}")
                        cls._active_uploads.pop(upload_id)
                    
                    metadata = json.loads(request.form['metadata'])
                    folder_name = metadata.get('folder_name', '')
                    upload_folder = UploadHandler.create_upload_folder(base_upload_folder, folder_name)
                    metadata['upload_folder'] = upload_folder
                    
                    cls._active_uploads[upload_id] = {
                        'chunks_received': set(),
                        'metadata': metadata,
                        'upload_folder': upload_folder
                    }
                    
                    MetadataHandler.save_metadata(metadata, upload_folder, filename)
                else:
                    if upload_id not in cls._active_uploads:
                        raise ValueError("Upload not properly initialized")
                    metadata = cls._active_uploads[upload_id]['metadata']
                    upload_folder = cls._active_uploads[upload_id]['upload_folder']

                if chunk in cls._active_uploads[upload_id]['chunks_received']:
                    current_app.logger.warning(f"Duplicate chunk received: {chunk}/{total_chunks}")
                    return {'status': 'Chunk already processed'}, 200

                current_app.logger.info(f"Processing chunk {chunk+1}/{total_chunks} for file {filename}")
                UploadHandler.handle_chunk(file, chunk, total_chunks, chunk_size, filename, upload_folder)
                cls._active_uploads[upload_id]['chunks_received'].add(chunk)

                if chunk == total_chunks - 1 and len(cls._active_uploads[upload_id]['chunks_received']) == total_chunks:
                    try:
                        filepath = os.path.join(upload_folder, filename)
                        result = FileProcessor.process_completed_upload(
                            filepath, upload_folder, filename, metadata
                        )
                        cls._active_uploads.pop(upload_id)
                        return result, 200
                    except Exception as e:
                        current_app.logger.error(f"Error in final processing: {str(e)}")
                        cls._active_uploads.pop(upload_id)
                        raise

                return {'status': 'Chunk received'}, 200

            except Exception as e:
                current_app.logger.error(f"Error processing chunk: {str(e)}")
                if upload_id in cls._active_uploads:
                    cls._active_uploads.pop(upload_id)
                raise