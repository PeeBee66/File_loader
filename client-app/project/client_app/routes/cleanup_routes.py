from flask import Blueprint, request, jsonify, current_app
import traceback
from ..operations.cleanup_operations import CleanupOperations

cleanup_routes = Blueprint('cleanup_routes', __name__)

@cleanup_routes.route('/cancel-upload', methods=['POST'])
def cancel_upload():
    """Handle upload cancellation request."""
    try:
        data = request.json
        if not data or 'folder_name' not in data:
            return jsonify({'error': 'No folder name provided'}), 400

        base_upload_folder = current_app.config.get('UPLOAD_FOLDER')
        response, status_code = CleanupOperations.cancel_upload(
            data['folder_name'], base_upload_folder
        )
        
        return jsonify(response), status_code

    except Exception as e:
        current_app.logger.error(f"Error in cancel_upload: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500