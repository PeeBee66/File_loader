"""Client application package."""
from flask import Blueprint
from .routes import main_routes, upload_routes, cleanup_routes

# Create the main blueprint
client_app = Blueprint('client_app', __name__, template_folder='../templates')

# Register route modules
client_app.register_blueprint(main_routes)
client_app.register_blueprint(upload_routes)
client_app.register_blueprint(cleanup_routes)

# Import error handlers
from . import error_handlers