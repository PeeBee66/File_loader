from flask import Blueprint, render_template, request, jsonify
import os
import json
import hashlib
import time
import shutil

client_app = Blueprint('client_app', __name__, template_folder='../templates')

# TODO: Replace "XXX" with your actual system name
SYSTEM_NAME = "XXX"

@client_app.route('/')
@client_app.route('/home')
def home():
    return render_template('home.html')

def generate_file_hash(file_path):
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

@client_app.route('/submit-data', methods=['POST'])
def submit_data():
    try:
        data = json.loads(request.form['json'])
        file = request.files['file']
        
        # Ensure default values are set
        data.setdefault('approved', 'No')
        data.setdefault('system', SYSTEM_NAME)
        
        save_dir = '/tmp'  # or wherever you want to save
        
        # Step 1: Save the file with original name
        original_file_path = os.path.join(save_dir, data['uploaded_filename'])
        file.save(original_file_path)
        print(f"File saved to: {original_file_path}")
        
        # Step 2: Rename the file if necessary
        if data['renameFile'] == 'Yes':
            new_file_path = os.path.join(save_dir, data['current_filename'])
            shutil.move(original_file_path, new_file_path)
            print(f"File renamed to: {new_file_path}")
        else:
            new_file_path = original_file_path
        
        # Step 3: Hash the file
        file_hash = generate_file_hash(new_file_path)
        data['file_hash'] = file_hash
        print(f"File Hash: {file_hash}")
        
        # Step 4: Save JSON
        json_filename = f"metadata_{int(time.time())}.json"
        json_path = os.path.join(save_dir, json_filename)
        with open(json_path, 'w') as f:
            json.dump(data, f, indent=4)
        print(f"Metadata saved to: {json_path}")
        
        return jsonify({'success': True, 'message': 'File processed and data saved successfully'})
    
    except Exception as e:
        print(f"Error processing file: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500