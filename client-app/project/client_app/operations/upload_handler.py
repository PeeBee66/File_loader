# project/client_app/operations/upload_handler.py

from flask import current_app
import os
import time
from ..utils import ensure_dir_exists

class UploadHandler:
    @staticmethod
    def handle_chunk(file, chunk, total_chunks, chunk_size, filename, upload_folder):
        """Write a chunk to the file with enhanced network share handling"""
        filepath = os.path.join(upload_folder, filename)
        max_retries = 3
        retry_delay = 1  # Start with 1 second delay
        
        for attempt in range(max_retries):
            try:
                # If this is the first chunk, ensure directory exists
                if chunk == 0:
                    ensure_dir_exists(upload_folder)

                # Simplified file writing without Windows-specific locking
                with open(filepath, 'ab') as f:
                    if chunk_size > 0:
                        f.seek(chunk * chunk_size)
                    file_chunk = file.read()
                    f.write(file_chunk)
                    f.flush()
                    os.fsync(f.fileno())  # Force write to disk

                current_app.logger.info(f"Chunk {chunk + 1}/{total_chunks} written successfully")
                return

            except IOError as e:
                current_app.logger.warning(f"Attempt {attempt + 1} failed: {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    current_app.logger.error(f"Failed to write chunk after {max_retries} attempts")
                    raise

            except Exception as e:
                current_app.logger.error(f"Error writing chunk: {str(e)}")
                raise

    @staticmethod
    def create_upload_folder(base_upload_folder, folder_name):
        """Create upload folder and return path"""
        upload_folder = os.path.join(base_upload_folder, folder_name)
        ensure_dir_exists(upload_folder)
        return upload_folder