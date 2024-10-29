# project/client_app/routes/__init__.py

from flask import Blueprint
from .main_routes import main_routes
from .upload_routes import upload_routes
from .cleanup_routes import cleanup_routes

# Create the main blueprint
client_app = Blueprint('client_app', __name__, template_folder='../templates')

# Register routes
client_app.register_blueprint(main_routes)
client_app.register_blueprint(upload_routes)
client_app.register_blueprint(cleanup_routes)
