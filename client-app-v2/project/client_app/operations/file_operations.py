# project/client_app/operations/file_operations.py (continued)

from flask import current_app, request
import json
from ..utils import get_metadata_path, find_metadata_file
from ..file_utils import handle_file_processing
from .upload_handler import UploadHandler
from .metadata_handler import MetadataHandler
from .file_processor import FileProcessor

class FileOperations:
    @staticmethod
    def process_chunk(file, chunk, total_chunks, chunk_size, filename, base_upload_folder):
        """Handle file chunk processing"""
        if not base_upload_folder:
            raise ValueError("UPLOAD_FOLDER not set in configuration")

        current_app.logger.info(f"Processing chunk {chunk+1}/{total_chunks} for file {filename}")
        
        try:
            # Handle metadata
            if chunk == 0:
                metadata = json.loads(request.form['metadata'])
                folder_name = metadata.get('folder_name', '')
                upload_folder = UploadHandler.create_upload_folder(base_upload_folder, folder_name)
                metadata['upload_folder'] = upload_folder
                MetadataHandler.save_metadata(metadata, upload_folder, filename)
            else:
                metadata = MetadataHandler.load_metadata(base_upload_folder, filename)
                upload_folder = metadata['upload_folder']

            # Handle chunk upload
            UploadHandler.handle_chunk(file, chunk, total_chunks, chunk_size, filename, upload_folder)
            
            # Process completed upload
            if chunk == total_chunks - 1:
                filepath = os.path.join(upload_folder, filename)
                return FileProcessor.process_completed_upload(
                    filepath, upload_folder, filename, metadata
                ), 200

            return {'status': 'Chunk received'}, 200

        except Exception as e:
            current_app.logger.error(f"Error in process_chunk: {str(e)}")
            return {'error': str(e)}, 500