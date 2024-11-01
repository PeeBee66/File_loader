from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import traceback
import os
import time
import json
from ..operations.file_operations import FileOperations
from ..file_utils import calculate_file_hash, verify_file_integrity
from ..utils import get_temp_dir

upload_routes = Blueprint('upload_routes', __name__)

@upload_routes.route('/upload-chunk', methods=['POST'])
def upload_chunk():
    """Handle chunk upload requests"""
    try:
        file = request.files.get('file')
        if not file:
            return jsonify({'error': 'No file chunk received'}), 400

        chunk = int(request.form.get('chunk', 0))
        total_chunks = int(request.form.get('totalChunks', 1))
        chunk_size = int(request.form.get('chunkSize', 0))
        filename = secure_filename(file.filename)

        # Get the base upload folder from config
        base_upload_folder = current_app.config.get('UPLOAD_FOLDER')
        if not base_upload_folder:
            return jsonify({'error': 'Upload folder not configured'}), 500

        return FileOperations.process_chunk(
            file=file,
            chunk=chunk,
            total_chunks=total_chunks,
            chunk_size=chunk_size,
            filename=filename,
            base_upload_folder=base_upload_folder
        )

    except Exception as e:
        current_app.logger.error(f"Error processing chunk: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@upload_routes.route('/verify-file', methods=['POST'])
def verify_file():
    """Verify uploaded file integrity."""
    try:
        data = request.json
        if not data:
            current_app.logger.error("No data received in verify_file")
            return jsonify({
                'verified': False,
                'error': 'No data received',
                'finalFilename': 'Unknown',
                'newHash': 'Verification Failed'
            }), 200

        # Get file path from the data
        file_path = data.get('filePath')
        if not file_path:
            current_app.logger.error("No file path provided in verify_file")
            return jsonify({
                'verified': False,
                'error': 'Missing file path',
                'finalFilename': 'Unknown',
                'newHash': 'Verification Failed'
            }), 200

        # Ensure the directory path exists
        dir_path = os.path.dirname(file_path)
        if not os.path.exists(dir_path):
            current_app.logger.error(f"Directory not found: {dir_path}")
            return jsonify({
                'verified': False,
                'error': 'Directory not found',
                'finalFilename': os.path.basename(file_path),
                'newHash': 'Verification Failed'
            }), 200

        # Find metadata file in the directory
        metadata_files = [f for f in os.listdir(dir_path) if f.endswith('_metadata.json')]
        if not metadata_files:
            current_app.logger.error(f"No metadata file found in {dir_path}")
            return jsonify({
                'verified': False,
                'error': 'Metadata file not found',
                'finalFilename': os.path.basename(file_path),
                'newHash': 'Verification Failed'
            }), 200

        # Read metadata file
        metadata_path = os.path.join(dir_path, metadata_files[0])
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)

        # Get verification information from metadata
        result = {
            'verified': metadata.get('verified', False),
            'originalHash': metadata.get('originalFileHash', ''),
            'newHash': metadata.get('fileHash', ''),
            'finalFilename': metadata.get('final_filename', os.path.basename(file_path)),
            'error': None if metadata.get('verified', False) else 'Hash verification failed'
        }
        
        current_app.logger.info(f"Verification completed. Result: {result}")
        return jsonify(result), 200
        
    except Exception as e:
        current_app.logger.error(f"Verification error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'verified': False,
            'error': str(e),
            'finalFilename': 'Error',
            'newHash': 'Verification Failed',
            'originalHash': 'Error'
        }), 200

@upload_routes.route('/calculate-hash', methods=['POST'])
def calculate_initial_hash():
    """Calculate hash of uploaded file with enhanced error handling"""
    temp_path = None
    try:
        current_app.logger.info("Starting hash calculation")
        file = request.files.get('file')
        if not file:
            return jsonify({'error': 'No file received'}), 400

        temp_dir = get_temp_dir()
        temp_path = os.path.join(temp_dir, secure_filename(file.filename))
        
        # Ensure the temp directory exists
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        
        current_app.logger.info(f"Saving file to temp location: {temp_path}")
        file.save(temp_path)
        
        current_app.logger.info("Calculating file hash...")
        file_hash = calculate_file_hash(temp_path)
        current_app.logger.info(f"Hash calculated: {file_hash}")
        
        # File cleanup with retries
        cleanup_success = False
        for attempt in range(3):
            try:
                if os.path.exists(temp_path):
                    os.close(os.open(temp_path, os.O_RDONLY))  # Close any open handles
                    os.remove(temp_path)
                    current_app.logger.info("Temporary file removed")
                    cleanup_success = True
                    break
            except Exception as e:
                current_app.logger.warning(f"Cleanup attempt {attempt + 1} failed: {str(e)}")
                time.sleep(1)
        
        if not cleanup_success:
            current_app.logger.warning("Could not remove temporary file, will be cleaned up later")
        
        return jsonify({'hash': file_hash, 'success': True})

    except Exception as e:
        error_msg = str(e)
        current_app.logger.error(f"Hash calculation error: {error_msg}")
        current_app.logger.error(traceback.format_exc())
        
        # Attempt cleanup even in case of error
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                current_app.logger.info("Temporary file removed after error")
            except Exception as cleanup_error:
                current_app.logger.error(f"Failed to clean up after error: {str(cleanup_error)}")
        
        return jsonify({
            'error': error_msg,
            'success': False,
            'traceback': traceback.format_exc()
        }), 500