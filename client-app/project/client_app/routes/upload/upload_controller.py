# project/client_app/routes/upload/upload_controller.py
"""Main controller for handling upload-related routes."""

from flask import Blueprint, jsonify, current_app, request  # Added request import
import traceback
from werkzeug.utils import secure_filename
from ...operations.file_operations import FileOperations

upload_routes = Blueprint('upload_routes', __name__)

@upload_routes.route('/upload-chunk', methods=['POST'])
def upload_chunk():
    """Handle chunk upload requests"""
    try:
        # Log the start of upload processing
        current_app.logger.info("Processing new chunk upload request")
        
        # Validate file presence
        file = request.files.get('file')
        if not file:
            current_app.logger.error("No file chunk received")
            return jsonify({'error': 'No file chunk received'}), 400

        # Get chunk information
        try:
            chunk = int(request.form.get('chunk', 0))
            total_chunks = int(request.form.get('totalChunks', 1))
            chunk_size = int(request.form.get('chunkSize', 0))
        except (TypeError, ValueError) as e:
            current_app.logger.error(f"Invalid chunk information: {str(e)}")
            return jsonify({'error': 'Invalid chunk information provided'}), 400

        # Secure the filename
        filename = secure_filename(file.filename)
        if not filename:
            current_app.logger.error("Invalid filename provided")
            return jsonify({'error': 'Invalid filename'}), 400

        # Get the base upload folder from config
        base_upload_folder = current_app.config.get('UPLOAD_FOLDER')
        if not base_upload_folder:
            current_app.logger.error("Upload folder not configured")
            return jsonify({'error': 'Upload folder not configured'}), 500

        # Log chunk processing details
        current_app.logger.info(f"Processing chunk {chunk + 1}/{total_chunks} for file: {filename}")

        # Process the chunk
        try:
            result = FileOperations.process_chunk(
                file=file,
                chunk=chunk,
                total_chunks=total_chunks,
                chunk_size=chunk_size,
                filename=filename,
                base_upload_folder=base_upload_folder
            )
            current_app.logger.info(f"Chunk processed successfully: {result}")
            return result

        except Exception as e:
            current_app.logger.error(f"Error in chunk processing: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            return jsonify({
                'error': str(e),
                'traceback': traceback.format_exc()
            }), 500

    except Exception as e:
        current_app.logger.error(f"Error processing chunk: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500