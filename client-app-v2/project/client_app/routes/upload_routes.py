from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import traceback
import os
from ..operations.file_operations import FileOperations
from ..file_utils import calculate_file_hash, verify_file_integrity
from ..utils import get_temp_dir

upload_routes = Blueprint('upload_routes', __name__)

@upload_routes.route('/upload-chunk', methods=['POST'])
def upload_chunk():
    """Handle file chunk uploads."""
    try:
        current_app.logger.info("Received chunk upload request")
        file = request.files['file']
        chunk = int(request.form['chunk'])
        total_chunks = int(request.form['totalChunks'])
        chunk_size = int(request.form.get('chunkSize', 0))
        filename = secure_filename(file.filename)
        
        base_upload_folder = current_app.config.get('UPLOAD_FOLDER')
        response, status_code = FileOperations.process_chunk(
            file, chunk, total_chunks, chunk_size, filename, base_upload_folder
        )
        
        return jsonify(response), status_code

    except Exception as e:
        current_app.logger.error(f"Error in upload_chunk: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

@upload_routes.route('/calculate-hash', methods=['POST'])
def calculate_initial_hash():
    """Calculate hash of uploaded file."""
    try:
        current_app.logger.info("Starting hash calculation")
        file = request.files['file']
        if not file:
            raise ValueError("No file received")

        temp_dir = get_temp_dir()
        temp_path = os.path.join(temp_dir, secure_filename(file.filename))
        current_app.logger.info(f"Saving file to temp location: {temp_path}")
        
        file.save(temp_path)
        
        current_app.logger.info("Calculating file hash...")
        file_hash = calculate_file_hash(temp_path)
        current_app.logger.info(f"Hash calculated: {file_hash}")
        
        try:
            os.remove(temp_path)
            current_app.logger.info("Temporary file removed")
        except Exception as e:
            current_app.logger.warning(f"Failed to remove temporary file: {str(e)}")
        
        return jsonify({'hash': file_hash})

    except Exception as e:
        current_app.logger.error(f"Hash calculation error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@upload_routes.route('/verify-file', methods=['POST'])
def verify_file():
    """Verify uploaded file integrity."""
    try:
        data = request.json
        if not data:
            raise ValueError("No data received")
        
        original_hash = data.get('originalHash')
        file_path = data.get('filePath')
        
        if not all([original_hash, file_path]):
            raise ValueError("Missing required parameters: originalHash or filePath")
        
        current_app.logger.info(f"Verifying file: {file_path}")
        verified = verify_file_integrity(original_hash, file_path)
        
        result = {
            'verified': verified,
            'newHash': calculate_file_hash(file_path) if verified else None,
            'finalFilename': os.path.basename(file_path)
        }
        
        current_app.logger.info(f"Verification completed. Result: {result}")
        return jsonify(result)
        
    except Exception as e:
        current_app.logger.error(f"Verification error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500