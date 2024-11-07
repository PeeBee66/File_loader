# project/client_app/routes/__init__.py
"""Routes package initialization."""

from flask import Blueprint
from .main_routes import main_routes
from .cleanup_routes import cleanup_routes
from .history_routes import history_routes
from .upload import create_upload_blueprint

# Get the upload blueprint
upload_routes = create_upload_blueprint()

__all__ = [
    'main_routes',
    'upload_routes',
    'cleanup_routes',
    'history_routes'
]