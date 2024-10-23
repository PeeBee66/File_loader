from flask import Blueprint, render_template, request, jsonify, current_app, abort
import os
import json
from datetime import datetime

admin_app = Blueprint('admin_app', __name__, template_folder='../templates')

@admin_app.route('/')
@admin_app.route('/home')
def home():
    current_app.logger.info("Accessed admin home route")
    upload_folder = current_app.config['UPLOAD_FOLDER']
    search_query = request.args.get('search', '').lower()
    
    if not os.path.exists(upload_folder):
        current_app.logger.warning(f"Upload folder does not exist: {upload_folder}")
        return render_template('admin/home.html', folder_data=[], error="Upload folder does not exist")
    
    folders = [f for f in os.listdir(upload_folder) if os.path.isdir(os.path.join(upload_folder, f))]
    
    folder_data = []
    for folder in folders:
        if search_query and search_query not in folder.lower():
            continue
        
        folder_path = os.path.join(upload_folder, folder)
        json_file = next((f for f in os.listdir(folder_path) if f.endswith('.json')), None)
        
        if json_file:
            with open(os.path.join(folder_path, json_file), 'r') as f:
                metadata = json.load(f)
            
            # Extract timestamp from folder name
            try:
                # Assuming the format is now "Operation_ItemNumber-SubNumber_DeviceType_YYYY-MM-DD_HHMM"
                parts = folder.split('_')
                date_part = parts[-2]
                time_part = parts[-1]
                timestamp_str = f"{date_part}_{time_part}"
                timestamp = datetime.strptime(timestamp_str, "%Y-%m-%d_%H%M")
            except (ValueError, IndexError):
                # If parsing fails, use the folder's creation time as a fallback
                timestamp = datetime.fromtimestamp(os.path.getctime(folder_path))
            
            folder_data.append({
                'folder_name': folder,
                'timestamp': timestamp,
                'operation': metadata.get('operation', 'N/A'),
                'date_of_collection': metadata.get('dateOfCollection', 'N/A'),
                'collection': metadata.get('collection', 'N/A'),
                'platform': metadata.get('platform', 'N/A'),
                'device_type': metadata.get('deviceType', 'N/A'),
                'serial': metadata.get('serialNumber', 'N/A'),
                'item_number': metadata.get('itemNumber', 'N/A'),
                'sub_number': metadata.get('subNumber', 'N/A'),
                'from_system': metadata.get('system', 'N/A'),
                'approved': metadata.get('approved', 'No'),
                'chunk_status': 'FILE UPLOAD COMPLETE' if os.path.exists(os.path.join(folder_path, metadata.get('new_filename', ''))) else 'UPLOAD FAIL',
                'known_passwords': metadata.get('knownPasswords', 'N/A'),
                'notes': metadata.get('notes', 'N/A'),
                'new_filename': metadata.get('new_filename', 'N/A'),
                'original_filename': metadata.get('original_filename', 'N/A'),
                'processing_method': metadata.get('processingMethod', 'Normal'),
            })
    
    # Sort folder_data by timestamp in descending order (newest first)
    folder_data.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return render_template('admin/home.html', folder_data=folder_data)

@admin_app.route('/approve/<folder_name>', methods=['POST'])
def approve_folder(folder_name):
    upload_folder = current_app.config['UPLOAD_FOLDER']
    folder_path = os.path.join(upload_folder, folder_name)
    json_file = next((f for f in os.listdir(folder_path) if f.endswith('.json')), None)
    
    if json_file:
        with open(os.path.join(folder_path, json_file), 'r+') as f:
            metadata = json.load(f)
            metadata['approved'] = 'Yes'
            f.seek(0)
            json.dump(metadata, f, indent=4)
            f.truncate()
        
        # Here you would trigger the quincy process
        # For now, we'll just log it
        current_app.logger.info(f"Quincy process triggered for folder: {folder_name}")
        
        return jsonify({'status': 'success', 'message': 'Folder approved and quincy process triggered'})
    
    return jsonify({'status': 'error', 'message': 'JSON file not found'}), 404

@admin_app.route('/delete/<folder_name>', methods=['POST'])
def delete_folder(folder_name):
    upload_folder = current_app.config['UPLOAD_FOLDER']
    folder_path = os.path.join(upload_folder, folder_name)
    
    if os.path.exists(folder_path):
        try:
            current_app.logger.info(f"Folder deleted: {folder_name}")
            shutil.rmtree(folder_path)
            return jsonify({'status': 'success', 'message': 'Folder deleted'})
        except Exception as e:
            current_app.logger.error(f"Error deleting folder {folder_name}: {str(e)}")
            return jsonify({'status': 'error', 'message': f'Error deleting folder: {str(e)}'}), 500
    
    return jsonify({'status': 'error', 'message': 'Folder not found'}), 404

@admin_app.route('/check-status/<folder_name>')
def check_status(folder_name):
    upload_folder = current_app.config['UPLOAD_FOLDER']
    folder_path = os.path.join(upload_folder, folder_name)
    
    if os.path.exists(folder_path):
        json_file = next((f for f in os.listdir(folder_path) if f.endswith('.json')), None)
        if json_file:
            with open(os.path.join(folder_path, json_file), 'r') as f:
                metadata = json.load(f)
            
            inventory_file = os.path.join(folder_path, 'inventory.csv')
            if os.path.exists(inventory_file):
                with open(inventory_file, 'r') as f:
                    inventory = f.read().splitlines()
                
                total_chunks = len(inventory)
                received_chunks = sum(1 for chunk in inventory if os.path.exists(os.path.join(folder_path, chunk)))
                
                status = f"Received {received_chunks} out of {total_chunks} chunks"
                if received_chunks == total_chunks:
                    status += ". All chunks received."
                    if os.path.exists(os.path.join(folder_path, metadata.get('new_filename', ''))):
                        status += " File is complete."
                    else:
                        status += " But final file is missing."
                else:
                    status += f". Missing {total_chunks - received_chunks} chunks."
                
                return jsonify({'status': 'success', 'message': 'Status checked', 'details': status})
            else:
                return jsonify({'status': 'error', 'message': 'Inventory file not found'}), 404
        else:
            return jsonify({'status': 'error', 'message': 'Metadata file not found'}), 404
    
    return jsonify({'status': 'error', 'message': 'Folder not found'}), 404

# Error handlers
@admin_app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@admin_app.errorhandler(500)
def internal_error(error):
    current_app.logger.error('Server Error: %s', (error))
    return render_template('500.html'), 500