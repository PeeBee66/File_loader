# project/client_app/operations/upload_handler.py

from flask import current_app
import os
from werkzeug.utils import secure_filename
from ..file_utils import calculate_file_hash
from ..utils import ensure_dir_exists

class UploadHandler:
    @staticmethod
    def handle_chunk(file, chunk, total_chunks, chunk_size, filename, upload_folder):
        """Write a chunk to the file"""
        try:
            filepath = os.path.join(upload_folder, filename)
            with open(filepath, 'ab') as f:
                if chunk_size > 0:
                    f.seek(chunk * chunk_size)
                file_chunk = file.read()
                f.write(file_chunk)
            current_app.logger.info(f"Chunk written successfully")
        except Exception as e:
            current_app.logger.error(f"Error writing chunk: {str(e)}")
            raise

    @staticmethod
    def create_upload_folder(base_upload_folder, folder_name):
        """Create upload folder and return path"""
        upload_folder = os.path.join(base_upload_folder, folder_name)
        ensure_dir_exists(upload_folder)
        return upload_folder