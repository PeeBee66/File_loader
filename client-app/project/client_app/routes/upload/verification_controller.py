# project/client_app/routes/upload/verification_controller.py
"""Controller for handling file verification routes."""

from flask import Blueprint, request, jsonify, current_app
import os
import json
import traceback

verification_routes = Blueprint('verification_routes', __name__)

@verification_routes.route('/verify-file', methods=['POST'])
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
