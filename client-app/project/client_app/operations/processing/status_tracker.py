# project/client_app/operations/processing/status_tracker.py
"""File processing status tracking."""

from flask import current_app
from ..metadata_handler import MetadataHandler

class ProcessingStatusTracker:
    @classmethod
    def get_processing_status(cls, upload_folder: str, filename: str) -> dict:
        """Get current processing status from metadata."""
        try:
            metadata = MetadataHandler.load_metadata(upload_folder, filename)
            return {
                'completed': metadata.get('processingCompleted', False),
                'error': metadata.get('processingError'),
                'verified': metadata.get('verified', False),
                'originalHash': metadata.get('originalFileHash'),
                'newHash': metadata.get('fileHash'),
                'finalFilename': metadata.get('final_filename'),
                'status': 'error' if metadata.get('processingError') else 
                         'completed' if metadata.get('processingCompleted') else 
                         'processing'
            }
        except Exception as e:
            current_app.logger.error(f"Error getting processing status: {str(e)}")
            return {
                'status': 'error',
                'error': str(e)
            }