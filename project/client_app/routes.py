# In project/client_app/routes.py

import os
import json
import hashlib
import time
from flask import Blueprint, render_template, request, jsonify, current_app, redirect, url_for

client_app = Blueprint('client_app', __name__, template_folder='../templates')

@client_app.route('/')
def index():
    return redirect(url_for('client_app.home'))

@client_app.route('/home')
def home():
    return render_template('home.html')

@client_app.route('/submit-data', methods=['POST'])
def submit_data():
    try:
        data = json.loads(request.form['json'])
        file = request.files['file']
        
        # Get the file save location and system name from the client
        file_save_location = data.get('fileSaveLocation', '/tmp/')
        system_name = data.get('system', 'XXX')  # Default to 'XXX' if not provided
        
        # Ensure default values are set
        data.setdefault('approved', 'No')
        data['system'] = system_name  # Use the system name from the client
        
        # Create the main pipeline output directory if it doesn't exist
        os.makedirs(file_save_location, exist_ok=True)
        
        # Create a folder name based on the rename syntax without file extension
        folder_name = os.path.splitext(data['current_filename'])[0]
        folder_path = os.path.join(file_save_location, folder_name)
        os.makedirs(folder_path, exist_ok=True)
        
        # Save the file in the new folder
        file_path = os.path.join(folder_path, data['current_filename'])
        file.save(file_path)
        print(f"File saved to: {file_path}")
        
        # Generate file hash
        file_hash = generate_file_hash(file_path)
        data['file_hash'] = file_hash
        print(f"File Hash: {file_hash}")
        
        # Save JSON in the same folder
        json_filename = f"metadata_{int(time.time())}.json"
        json_path = os.path.join(folder_path, json_filename)
        with open(json_path, 'w') as f:
            json.dump(data, f, indent=4)
        print(f"Metadata saved to: {json_path}")
        
        return jsonify({'success': True, 'message': 'File processed and data saved successfully'})
    
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

def generate_file_hash(file_path):
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

# Error handlers
@client_app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@client_app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500