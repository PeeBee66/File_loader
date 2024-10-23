# routes.py

from flask import Blueprint, render_template, request, jsonify, current_app, abort
from werkzeug.utils import secure_filename
import os
import json
import traceback
import shutil

client_app = Blueprint('client_app', __name__, template_folder='../templates')

@client_app.route('/')
@client_app.route('/home')
def home():
    current_app.logger.info("Accessed home route")
    return render_template('home.html')

# routes.py

from flask import Blueprint, render_template, request, jsonify, current_app, abort
from werkzeug.utils import secure_filename
import os
import json
import traceback
import shutil

client_app = Blueprint('client_app', __name__, template_folder='../templates')

@client_app.route('/')
@client_app.route('/home')
def home():
    current_app.logger.info("Accessed home route")
    return render_template('home.html')

@client_app.route('/upload-chunk', methods=['POST'])
def upload_chunk():
    try:
        current_app.logger.info("Received chunk upload request")
        file = request.files['file']
        chunk = int(request.form['chunk'])
        total_chunks = int(request.form['totalChunks'])
        chunk_size = int(request.form.get('chunkSize', 0))  # Get chunkSize with a default of 0
        filename = secure_filename(file.filename)

        current_app.logger.info(f"Processing chunk {chunk+1}/{total_chunks} for file {filename}")

        base_upload_folder = current_app.config.get('UPLOAD_FOLDER')
        if not base_upload_folder:
            raise ValueError("UPLOAD_FOLDER not set in configuration")
        
        current_app.logger.info(f"Using base upload folder: {base_upload_folder}")

        if chunk == 0:
            metadata = json.loads(request.form['metadata'])
            current_app.logger.info(f"Received metadata: {metadata}")
            folder_name = metadata.get('folder_name', os.path.splitext(filename)[0])
            upload_folder = os.path.join(base_upload_folder, folder_name)
            os.makedirs(upload_folder, exist_ok=True)
            current_app.logger.info(f"Created folder: {upload_folder}")

            metadata['upload_folder'] = upload_folder
            metadata_path = os.path.join(upload_folder, f"{filename}_metadata.json")
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=4)
            current_app.logger.info(f"Metadata saved to: {metadata_path}")
        else:
            metadata_filename = f"{filename}_metadata.json"
            for root, dirs, files in os.walk(base_upload_folder):
                if metadata_filename in files:
                    with open(os.path.join(root, metadata_filename), 'r') as f:
                        metadata = json.load(f)
                    upload_folder = metadata['upload_folder']
                    current_app.logger.info(f"Found existing metadata file: {os.path.join(root, metadata_filename)}")
                    break
            else:
                raise ValueError(f"Metadata file not found for {filename}")

        filepath = os.path.join(upload_folder, filename)
        current_app.logger.info(f"Saving chunk to: {filepath}")
        
        with open(filepath, 'ab') as f:
            if chunk_size > 0:
                f.seek(chunk * chunk_size)
            file_chunk = file.read()
            f.write(file_chunk)

        if chunk == total_chunks - 1:
            current_app.logger.info(f"File upload completed: {filename}")
            return jsonify({'status': 'File upload completed'})
        else:
            return jsonify({'status': 'Chunk received'})

    except Exception as e:
        current_app.logger.error(f"Error in upload_chunk: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

@client_app.route('/complete-upload', methods=['POST'])
def complete_upload():
    try:
        current_app.logger.info("Received complete upload request")
        data = request.json
        current_app.logger.info(f"Request data: {data}")
        
        if not data:
            raise ValueError("No JSON data received")
        
        filename = secure_filename(data.get('filename'))
        metadata = data.get('metadata')
        
        if not filename or not metadata:
            raise ValueError(f"Missing required data. Filename: {filename}, Metadata: {metadata}")
        
        current_app.logger.info(f"Filename: {filename}, Metadata: {metadata}")
        
        base_upload_folder = current_app.config.get('UPLOAD_FOLDER')
        if not base_upload_folder:
            raise ValueError("UPLOAD_FOLDER not set in configuration")
        
        current_app.logger.info(f"Base upload folder: {base_upload_folder}")
        
        folder_name = metadata.get('folder_name')
        upload_folder = os.path.join(base_upload_folder, folder_name)
        
        if not os.path.exists(upload_folder):
            raise FileNotFoundError(f"Upload folder not found: {upload_folder}")

        current_app.logger.info(f"Upload folder found: {upload_folder}")

        original_filepath = os.path.join(upload_folder, filename)
        final_filename = filename
        
        if metadata.get('rename_file') and metadata.get('new_filename'):
            new_filename = secure_filename(metadata['new_filename'])
            new_filepath = os.path.join(upload_folder, new_filename)
            
            if os.path.exists(original_filepath):
                current_app.logger.info(f"Attempting to rename file from {filename} to {new_filename}")
                try:
                    os.rename(original_filepath, new_filepath)
                    current_app.logger.info(f"File successfully renamed from {filename} to {new_filename}")
                    final_filename = new_filename
                except Exception as e:
                    current_app.logger.error(f"Error renaming file: {str(e)}")
                    current_app.logger.info(f"File will remain as: {filename}")
            elif os.path.exists(new_filepath):
                current_app.logger.info(f"File already renamed to {new_filename}")
                final_filename = new_filename
            else:
                raise FileNotFoundError(f"Neither original file nor renamed file found: {original_filepath} or {new_filepath}")
        else:
            if not os.path.exists(original_filepath):
                raise FileNotFoundError(f"Original file not found: {original_filepath}")
        
        current_app.logger.info(f"File exists: {os.path.join(upload_folder, final_filename)}")
        
        # Update metadata
        old_metadata_filename = f"{filename}_metadata.json"
        new_metadata_filename = f"{final_filename}_metadata.json"
        old_metadata_path = os.path.join(upload_folder, old_metadata_filename)
        new_metadata_path = os.path.join(upload_folder, new_metadata_filename)
        
        try:
            if os.path.exists(old_metadata_path):
                with open(old_metadata_path, 'r') as f:
                    metadata_content = json.load(f)
            else:
                metadata_content = metadata
            
            metadata_content['new_filename'] = final_filename
            
            with open(new_metadata_path, 'w') as f:
                json.dump(metadata_content, f, indent=4)
            
            current_app.logger.info(f"Metadata updated and saved to: {new_metadata_path}")
            
            # Remove old metadata file if it's different from the new one
            if old_metadata_path != new_metadata_path and os.path.exists(old_metadata_path):
                try:
                    os.remove(old_metadata_path)
                    current_app.logger.info(f"Old metadata file removed: {old_metadata_path}")
                except Exception as e:
                    current_app.logger.warning(f"Could not remove old metadata file: {str(e)}")
        except Exception as e:
            current_app.logger.error(f"Error updating metadata: {str(e)}")

        final_filepath = os.path.join(upload_folder, final_filename)
        current_app.logger.info(f"Upload and processing completed for file: {final_filepath}")

        return jsonify({
            'status': 'Upload completed',
            'file': final_filename,
            'upload_folder': upload_folder,
            'full_path': final_filepath,
            'renamed': final_filename != filename
        })

    except Exception as e:
        current_app.logger.error(f"Error in complete_upload: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500
    
@client_app.route('/config')
def get_config():
    config = {
        'UPLOAD_FOLDER': current_app.config.get('UPLOAD_FOLDER', '/tmp/uploads'),
        'MAX_FILE_SIZE': current_app.config.get('MAX_FILE_SIZE', 200 * 1024 * 1024 * 1024),
        'SYSTEM_NAME': current_app.config.get('SYSTEM_NAME', 'Unknown')
    }
    current_app.logger.info(f"Config requested: {config}")
    return jsonify(config)

@client_app.errorhandler(404)
def not_found_error(error):
    if request.path.startswith('/static/'):
        return "File not found", 404
    return render_template('404.html'), 404

@client_app.errorhandler(500)
def internal_error(error):
    current_app.logger.error(f"500 error: {str(error)}")
    current_app.logger.error(traceback.format_exc())
    return jsonify({'error': 'Internal server error', 'message': str(error), 'traceback': traceback.format_exc()}), 500