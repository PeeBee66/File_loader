# project/client_app/operations/metadata_handler.py

from flask import current_app
import os
import json
from datetime import datetime
from ..utils import get_metadata_path, find_metadata_file

class MetadataHandler:
    @staticmethod
    def save_metadata(metadata: dict, upload_folder: str, filename: str) -> dict:
        """Save metadata to file with enhanced error handling and proper file handling"""
        try:
            # Remove any _complete suffix from filename when creating metadata path
            base_filename = filename.replace('_complete', '')
            metadata_path = get_metadata_path(upload_folder, base_filename)
            current_app.logger.info(f"Saving metadata to: {metadata_path}")
            
            # Add timestamp using datetime
            metadata['last_updated'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(metadata_path), exist_ok=True)
            
            # Update existing metadata if it exists
            if os.path.exists(metadata_path):
                try:
                    with open(metadata_path, 'r') as f:
                        existing_metadata = json.load(f)
                    # Merge existing metadata with new metadata
                    existing_metadata.update(metadata)
                    metadata = existing_metadata
                except Exception as e:
                    current_app.logger.error(f"Error reading existing metadata: {str(e)}")

            # Write the metadata
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=4)
            
            # If this is a completion update, ensure we're not creating a duplicate file
            if '_complete' in filename and not metadata_path.endswith('_complete.json'):
                complete_metadata_path = get_metadata_path(upload_folder, filename)
                if os.path.exists(complete_metadata_path) and complete_metadata_path != metadata_path:
                    try:
                        os.remove(complete_metadata_path)
                        current_app.logger.info(f"Removed duplicate metadata file: {complete_metadata_path}")
                    except Exception as e:
                        current_app.logger.error(f"Error removing duplicate metadata: {str(e)}")
            
            return metadata
            
        except Exception as e:
            current_app.logger.error(f"Error saving metadata: {str(e)}")
            raise

    @staticmethod
    def load_metadata(base_upload_folder: str, filename: str) -> dict:
        """Load metadata from file with improved file searching"""
        try:
            # First try to find the metadata file without _complete suffix
            base_filename = filename.replace('_complete', '')
            metadata_path = find_metadata_file(base_upload_folder, base_filename)
            
            # If not found, try with _complete suffix
            if not metadata_path and not filename.endswith('_complete'):
                metadata_path = find_metadata_file(base_upload_folder, f"{base_filename}_complete")
            
            if not metadata_path:
                raise ValueError(f"Metadata file not found for {filename}")
                
            current_app.logger.info(f"Found metadata file: {metadata_path}")
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
                
            # Ensure critical fields exist
            metadata.setdefault('originalFilename', 'Unknown File')
            metadata.setdefault('newFilename', 'N/A')
            metadata.setdefault('operation', 'Unknown Operation')
            metadata.setdefault('dateOfCollection', 'N/A')
            metadata.setdefault('itemNumber', 'N/A')
            metadata.setdefault('subNumber', 'N/A')
            
            return metadata
            
        except Exception as e:
            current_app.logger.error(f"Error loading metadata: {str(e)}")
            raise