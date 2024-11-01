# project/client_app/routes/__init__.py

from flask import Blueprint
from .main_routes import main_routes
from .upload_routes import upload_routes
from .cleanup_routes import cleanup_routes
from .history_routes import history_routes

__all__ = [
    'main_routes',
    'upload_routes',
    'cleanup_routes',
    'history_routes'
]