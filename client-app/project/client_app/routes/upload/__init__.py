# project/client_app/routes/upload/__init__.py
"""Upload routes package initialization."""

from flask import Blueprint, request
from .upload_controller import upload_routes
from .verification_controller import verification_routes
from .hash_controller import hash_routes

def create_upload_blueprint():
    """Create and configure the upload blueprint with all routes."""
    upload_blueprint = Blueprint('upload', __name__, url_prefix='/upload')
    
    # Register all route blueprints without additional URL prefix
    upload_blueprint.register_blueprint(upload_routes)
    upload_blueprint.register_blueprint(verification_routes)
    upload_blueprint.register_blueprint(hash_routes)
    
    return upload_blueprint