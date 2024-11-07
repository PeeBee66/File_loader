# project/client_app/operations/cleanup_operations.py
from flask import current_app
import os
import shutil

class CleanupOperations:
    @staticmethod
    def cancel_upload(folder_name, base_upload_folder):
        """Handle upload cancellation and cleanup"""
        if not base_upload_folder:
            return {'error': 'Upload folder not configured'}, 500

        folder_path = os.path.join(base_upload_folder, folder_name)
        current_app.logger.info(f"Attempting to delete folder: {folder_path}")
        
        if not os.path.exists(folder_path):
            current_app.logger.info(f"Folder not found: {folder_path}")
            return {'status': 'success', 'message': 'Folder not found'}, 200

        try:
            shutil.rmtree(folder_path)
            current_app.logger.info(f"Successfully deleted folder: {folder_path}")
            return {'status': 'success', 'message': 'Upload cancelled and folder deleted'}, 200
        except Exception as e:
            current_app.logger.error(f"Error deleting folder: {str(e)}")
            return {'error': f'Error deleting folder: {str(e)}'}, 500