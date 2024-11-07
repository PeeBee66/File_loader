# project/client_app/routes/main_routes.py

import os
import json
from flask import Blueprint, render_template, request, jsonify, current_app
from datetime import datetime
from ..utils import get_temp_dir
from .history_routes import get_metadata_from_folder

main_routes = Blueprint('main_routes', __name__)

@main_routes.route('/')
@main_routes.route('/home')
def home():
    """Render the home page."""
    return render_template('home.html')

@main_routes.route('/history')
def history():
    """Render the history page."""
    try:
        upload_folder = current_app.config['UPLOAD_FOLDER']
        folder_data = []
        
        # Get all folders and sort by modification time (newest first)
        folders = [(f.path, f.name) for f in os.scandir(upload_folder) if f.is_dir()]
        folders.sort(key=lambda x: os.path.getmtime(x[0]), reverse=True)

        for folder_path, folder_name in folders:
            metadata = get_metadata_from_folder(folder_path)
            if metadata:
                folder_data.append({
                    "name": metadata.get("operation", "Unknown Operation"),
                    "date": metadata.get("dateOfCollection", "Unknown Date"),
                    "folder": folder_name,
                    "verified": metadata.get("verified", False),
                    "metadata": metadata
                })

        current_app.logger.info(f"Found {len(folder_data)} folders with metadata")
        return render_template('history.html', folder_data=folder_data)
        
    except Exception as e:
        current_app.logger.error(f"Error loading history page: {str(e)}")
        return render_template('history.html', folder_data=[])

@main_routes.route('/config')
def get_config():
    """Get application configuration."""
    config = {
        'UPLOAD_FOLDER': current_app.config.get('UPLOAD_FOLDER', '/tmp/uploads'),
        'MAX_FILE_SIZE': current_app.config.get('MAX_FILE_SIZE', 200 * 1024 * 1024 * 1024),
        'SYSTEM_NAME': current_app.config.get('SYSTEM_NAME', 'Unknown')
    }
    return jsonify(config)