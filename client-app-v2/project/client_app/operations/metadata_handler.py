# project/client_app/operations/metadata_handler.py

import os
import json
from flask import current_app
from ..utils import get_metadata_path, find_metadata_file

class MetadataHandler:
    @staticmethod
    def save_metadata(metadata: dict, upload_folder: str, filename: str) -> dict:
        """Save metadata to file"""
        try:
            metadata_path = get_metadata_path(upload_folder, filename)
            current_app.logger.info(f"Creating metadata file at: {metadata_path}")
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=4)
            return metadata
        except Exception as e:
            current_app.logger.error(f"Error saving metadata: {str(e)}")
            raise

    @staticmethod
    def load_metadata(base_upload_folder: str, filename: str) -> dict:
        """Load metadata from file"""
        metadata_path = find_metadata_file(base_upload_folder, filename)
        if not metadata_path:
            raise ValueError(f"Metadata file not found for {filename}")
            
        current_app.logger.info(f"Found metadata file: {metadata_path}")
        with open(metadata_path, 'r') as f:
            return json.load(f)