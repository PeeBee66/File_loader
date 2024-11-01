# project/client_app/__init__.py

"""Client application package - initializes blueprints and error handlers."""

from flask import Blueprint

# Create the main blueprint
client_app = Blueprint(
    'client_app',
    __name__,
    template_folder='../templates',
    static_folder='../static'
)

# Import route modules
from .routes.main_routes import main_routes
from .routes.upload_routes import upload_routes
from .routes.cleanup_routes import cleanup_routes
from .routes.history_routes import history_routes

# Register route modules
client_app.register_blueprint(main_routes)
client_app.register_blueprint(upload_routes)
client_app.register_blueprint(cleanup_routes)
client_app.register_blueprint(history_routes)

# Import error handlers
from . import error_handlers

# Register error handlers
error_handlers.register_error_handlers(client_app)