from flask import Blueprint, render_template, jsonify, current_app
from ..utils import get_temp_dir

main_routes = Blueprint('main_routes', __name__)

@main_routes.route('/')
@main_routes.route('/home')
def home():
    """Render the home page."""
    current_app.logger.info("Accessed home route")
    return render_template('home.html')

@main_routes.route('/config')
def get_config():
    """Get application configuration."""
    config = {
        'UPLOAD_FOLDER': current_app.config.get('UPLOAD_FOLDER', '/tmp/uploads'),
        'MAX_FILE_SIZE': current_app.config.get('MAX_FILE_SIZE', 200 * 1024 * 1024 * 1024),
        'SYSTEM_NAME': current_app.config.get('SYSTEM_NAME', 'Unknown')
    }
    current_app.logger.info(f"Config requested: {config}")
    return jsonify(config)