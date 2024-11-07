# project/client_app/routes/history_routes.py
import os
import shutil
from flask import Blueprint, jsonify, request, current_app, render_template
import json
import csv
from datetime import datetime

history_routes = Blueprint('history_routes', __name__)

def get_metadata_from_folder(folder_path):
    """Extract metadata from a folder's metadata.json file."""
    try:
        # Look for both regular and _complete metadata files
        metadata_files = [f for f in os.listdir(folder_path) 
                         if f.endswith('_metadata.json')]
        
        if not metadata_files:
            return None
            
        # Prefer the completed metadata file if it exists
        completed_metadata = next((f for f in metadata_files if '_complete_metadata.json' in f), None)
        metadata_path = os.path.join(folder_path, 
                                   completed_metadata if completed_metadata else metadata_files[0])
        
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
            
        # Ensure required fields exist
        metadata.setdefault('originalFilename', 'Unknown File')
        metadata.setdefault('newFilename', 'N/A')
        metadata.setdefault('operation', 'Unknown Operation')
        metadata.setdefault('dateOfCollection', 'N/A')
        metadata.setdefault('itemNumber', 'N/A')
        metadata.setdefault('subNumber', 'N/A')
        metadata.setdefault('fileSize', 0)
        
        return metadata
        
    except Exception as e:
        current_app.logger.error(f"Error reading metadata: {str(e)}")
        return None

def get_inventory_from_folder(folder_path):
    """Extract chunk inventory from any *_inventory.csv files in the folder."""
    try:
        # Look for any file ending with _inventory.csv
        inventory_files = [f for f in os.listdir(folder_path) if f.endswith('_inventory.csv')]
        
        if not inventory_files:
            current_app.logger.debug(f"No inventory files found in {folder_path}")
            return []

        # Use the first inventory file found
        inventory_path = os.path.join(folder_path, inventory_files[0])
        current_app.logger.info(f"Found inventory file: {inventory_path}")

        chunks = []
        try:
            with open(inventory_path, 'r') as f:
                # Skip empty lines and handle potential BOM
                csv_content = f.read().strip()
                if csv_content.startswith('\ufeff'):
                    csv_content = csv_content[1:]
                
                if not csv_content:
                    return []

                # Create a CSV reader from the content
                reader = csv.DictReader(csv_content.splitlines())
                
                # Map CSV columns to expected names
                for row in reader:
                    chunk_data = {
                        'file': row.get('filename', row.get('file', '')),
                        'chunk': row.get('chunk', ''),
                        'hash': row.get('hash', ''),
                        'size': row.get('size', '0')
                    }
                    chunks.append(chunk_data)
                
                current_app.logger.info(f"Successfully read {len(chunks)} chunks from inventory")
                return chunks
        except Exception as e:
            current_app.logger.error(f"Error reading CSV file {inventory_path}: {str(e)}")
            return []

    except Exception as e:
        current_app.logger.error(f"Error accessing folder {folder_path}: {str(e)}")
        return []

@history_routes.route('/history')
def history():
    """Render the history page."""
    return render_template('history.html')
@history_routes.route('/api/folders')
def get_folders():
    """Get all folders with their metadata and inventory."""
    try:
        upload_folder = current_app.config['UPLOAD_FOLDER']
        folders_data = []

        # Get folders and sort by modification time (newest first)
        folders = [(f.path, f.name) for f in os.scandir(upload_folder) if f.is_dir()]
        folders.sort(key=lambda x: os.path.getmtime(x[0]), reverse=True)

        for folder_path, folder_name in folders:
            metadata = get_metadata_from_folder(folder_path)
            if metadata:
                # Get inventory and log its presence
                inventory = get_inventory_from_folder(folder_path)
                has_inventory = bool(inventory)
                
                # Format file size for display
                file_size_gb = metadata.get('fileSize', 0) / (1024 * 1024 * 1024)
                
                folder_info = {
                    'name': folder_name,
                    'metadata': {
                        **metadata,
                        'formatted_file_size': f"{file_size_gb:.2f} GB",
                        'formatted_item_sub': f"Item NO: {metadata.get('itemNumber', 'N/A')} " +
                                            f"Sub {metadata.get('subNumber', 'N/A')}"
                    },
                    'inventory': inventory,
                    'has_inventory': has_inventory
                }
                folders_data.append(folder_info)

        return jsonify(folders_data)

    except Exception as e:
        current_app.logger.error(f"Error getting folders: {str(e)}")
        return jsonify({'error': str(e)}), 500

@history_routes.route('/api/delete-folder', methods=['POST'])
def delete_folder():
    """Handle folder deletion requests"""
    try:
        data = request.json
        if not data or 'folder_path' not in data:
            return jsonify({'error': 'No folder path provided'}), 400

        folder_path = data['folder_path']
        
        # Verify the folder path is within the allowed upload directory
        upload_folder = current_app.config['UPLOAD_FOLDER']
        if not os.path.commonpath([folder_path, upload_folder]) == upload_folder:
            return jsonify({'error': 'Invalid folder path'}), 400

        if not os.path.exists(folder_path):
            return jsonify({'error': 'Folder not found'}), 404

        # Remove the directory and all its contents
        shutil.rmtree(folder_path)
        
        current_app.logger.info(f"Successfully deleted folder: {folder_path}")
        return jsonify({
            'status': 'success',
            'message': 'Folder deleted successfully'
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error deleting folder: {str(e)}")
        return jsonify({'error': str(e)}), 500
@history_routes.route('/api/resend-chunk', methods=['POST'])
def resend_chunk():
    """Handle chunk resend request."""
    try:
        data = request.json
        current_app.logger.info(f"Received resend request data: {data}")
        
        if not data or not data.get('metadata'):
            current_app.logger.error("No metadata provided in request")
            return jsonify({'error': 'Metadata required'}), 400

        metadata = data.get('metadata')
        new_filename = metadata.get('newFilename') or metadata.get('final_filename')
        chunk_number = str(data.get('chunk', '')).replace('chunk', '').strip()
        
        if not new_filename:
            current_app.logger.error("No newFilename found in metadata")
            return jsonify({'error': 'New filename not found in metadata'}), 400

        # Extract base name by removing _complete and extension
        base_name = new_filename.rsplit('_complete', 1)[0]
        current_app.logger.info(f"Base name for resend file: {base_name}")

        # Create resend filename with chunk number
        resend_filename = f"{base_name}_resend{chunk_number}.json"
        current_app.logger.info(f"Generated resend filename: {resend_filename}")

        # Get upload folder from metadata
        upload_folder = metadata.get('upload_folder')
        if not upload_folder:
            current_app.logger.error("Upload folder not found in metadata")
            return jsonify({'error': 'Upload folder not found'}), 400

        # Add resend information to metadata
        resend_metadata = metadata.copy()
        resend_metadata.update({
            'resendChunk': data.get('chunk'),
            'resendChunkHash': data.get('hash'),
            'resendChunkSize': data.get('size')
        })

        # Create resend json file
        resend_path = os.path.join(upload_folder, resend_filename)
        current_app.logger.info(f"Creating resend file at: {resend_path}")

        with open(resend_path, 'w') as f:
            json.dump(resend_metadata, f, indent=4)

        return jsonify({
            'message': 'Resend request created successfully',
            'location': resend_path,
            'filename': resend_filename
        })

    except Exception as e:
        current_app.logger.error(f"Error processing resend: {str(e)}")
        current_app.logger.error(f"Full error details: ", exc_info=True)
        return jsonify({'error': str(e)}), 500