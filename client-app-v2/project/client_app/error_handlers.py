# project/client_app/error_handlers.py

from flask import jsonify, render_template, request, current_app
from werkzeug.exceptions import HTTPException

def register_error_handlers(app):
    """Registers error handlers with the Flask app instance."""

    @app.errorhandler(404)
    def not_found_error(error):
        """Handle 404 errors."""
        if request.path.startswith('/static/'):
            return "File not found", 404
        return render_template('404.html'), 404

    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors."""
        current_app.logger.error(f"500 error: {str(error)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(error)
        }), 500

    @app.errorhandler(Exception)
    def handle_exception(e):
        """Handle unhandled exceptions."""
        if isinstance(e, HTTPException):
            return e
        current_app.logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Internal Server Error',
            'message': str(e)
        }), 500
