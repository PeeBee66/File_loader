from flask import Flask
from logging.handlers import RotatingFileHandler
import logging
import os
from config import config

def create_app(config_name='default'):
    app = Flask(__name__)

    # Load the configuration
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
    from .client_app import client_app
    app.register_blueprint(client_app)

    return app