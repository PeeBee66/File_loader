from flask import Flask, jsonify, send_from_directory
from werkzeug.exceptions import HTTPException
import logging
from logging.handlers import RotatingFileHandler
import os
from config import Config, config

def create_app(config_name='default'):
    app = Flask(__name__)
    
    # Load the configuration
    app.config.from_object(Config)
    app.config.from_object(config[config_name])
    
    # Configure logging
    if not app.debug:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/pipeline.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Pipeline startup')

    # Register Blueprints
    from .client_app.routes import client_app
    app.register_blueprint(client_app)

    # Custom static data
    @app.route('/static/<path:filename>')
    def custom_static(filename):
        return send_from_directory(app.config['STATIC_FOLDER'], filename)

    # Global error handler
    @app.errorhandler(Exception)
    def handle_exception(e):
        # Pass through HTTP errors
        if isinstance(e, HTTPException):
            return e

        # Now you're handling non-HTTP exceptions only
        app.logger.error(f'Unhandled exception: {str(e)}', exc_info=True)
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500

    return app