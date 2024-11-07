# project/client_app/routes/upload/hash_controller.py
from flask import Blueprint, request, jsonify, current_app
import os
import hashlib
import tempfile
from werkzeug.utils import secure_filename

hash_routes = Blueprint('hash_routes', __name__)

class ChunkedHashCalculator:
    def __init__(self):
        self.md5_hash = hashlib.md5()
        self.chunks_received = set()
        self.total_chunks = 0
        self.temp_dir = None
        
    def update_hash(self, chunk_data):
        self.md5_hash.update(chunk_data)
        
    def get_hash(self):
        return self.md5_hash.hexdigest()

# Store active hash calculations
active_calculations = {}

@hash_routes.route('/calculate-hash-chunk', methods=['POST'])
def calculate_hash_chunk():
    """Handle chunked hash calculation"""
    try:
        chunk = request.files.get('file')
        if not chunk:
            return jsonify({'error': 'No chunk received'}), 400

        chunk_number = int(request.form.get('chunk', 0))
        total_chunks = int(request.form.get('totalChunks', 1))
        file_size = int(request.form.get('fileSize', 0))

        # Create unique ID for this file
        file_id = f"{secure_filename(chunk.filename)}_{file_size}"

        # Initialize hash calculator if needed
        if chunk_number == 0:
            active_calculations[file_id] = ChunkedHashCalculator()
            active_calculations[file_id].total_chunks = total_chunks
            active_calculations[file_id].temp_dir = tempfile.mkdtemp()

        calculator = active_calculations.get(file_id)
        if not calculator:
            return jsonify({'error': 'Hash calculation session not found'}), 400

        # Process chunk
        if chunk_number not in calculator.chunks_received:
            chunk_data = chunk.read()
            calculator.update_hash(chunk_data)
            calculator.chunks_received.add(chunk_number)

        # Check if all chunks received
        is_complete = len(calculator.chunks_received) == calculator.total_chunks

        if is_complete:
            final_hash = calculator.get_hash()
            
            # Cleanup
            if calculator.temp_dir and os.path.exists(calculator.temp_dir):
                try:
                    os.rmdir(calculator.temp_dir)
                except:
                    pass
            del active_calculations[file_id]
            
            return jsonify({
                'status': 'complete',
                'finalHash': final_hash
            })

        return jsonify({
            'status': 'processing',
            'chunksReceived': len(calculator.chunks_received),
            'totalChunks': calculator.total_chunks
        })

    except Exception as e:
        current_app.logger.error(f"Error in hash calculation: {str(e)}")
        return jsonify({'error': str(e)}), 500

@hash_routes.route('/cancel-hash-calculation', methods=['POST'])
def cancel_hash_calculation():
    """Cancel an ongoing hash calculation"""
    try:
        data = request.json
        file_id = data.get('fileId')
        
        if file_id in active_calculations:
            calculator = active_calculations[file_id]
            if calculator.temp_dir and os.path.exists(calculator.temp_dir):
                try:
                    os.rmdir(calculator.temp_dir)
                except:
                    pass
            del active_calculations[file_id]
            
        return jsonify({'status': 'cancelled'})
        
    except Exception as e:
        current_app.logger.error(f"Error cancelling hash calculation: {str(e)}")
        return jsonify({'error': str(e)}), 500