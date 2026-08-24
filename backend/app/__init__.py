"""
SecureVote Flask Application Factory.
"""
import os
import time
import logging
from threading import Thread
from flask import Flask, jsonify
from .config import config_by_name
from .extensions import jwt, cors, init_db

# Prevent duplicate background threads in debug reloaders
_scheduler_started = False

def start_background_scheduler(app):
    global _scheduler_started
    if _scheduler_started:
        return
    _scheduler_started = True

    def scheduler_loop():
        time.sleep(3)  # Wait for startup
        while True:
            try:
                from .services.election_service import ElectionService
                ElectionService.process_lifecycle_checks(app)
            except Exception as e:
                logging.getLogger(__name__).error(f"Background election scheduler error: {str(e)}")
            time.sleep(20)  # Check every 20 seconds

    t = Thread(target=scheduler_loop, daemon=True)
    t.start()


def create_app(config_name=None):
    """Create and configure the Flask application."""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__, static_folder=None)
    app.config.from_object(config_by_name.get(config_name, config_by_name['development']))

    # Ensure upload directory exists
    upload_folder = app.config.get('UPLOAD_FOLDER', 'uploads/faces')
    os.makedirs(upload_folder, exist_ok=True)

    # Initialize extensions
    init_db(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.admin import admin_bp
    from .routes.election import election_bp
    from .routes.vote import vote_bp
    from .routes.notification import notification_bp
    from .routes.voter import voter_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(election_bp, url_prefix='/api')
    app.register_blueprint(vote_bp, url_prefix='/api')
    app.register_blueprint(notification_bp, url_prefix='/api')
    app.register_blueprint(voter_bp, url_prefix='/api')

    # JWT error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'success': False,
            'message': 'Token has expired. Please login again.',
            'data': None
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Invalid token. Please login again.',
            'data': None
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'success': False,
            'message': 'Authentication required.',
            'data': None
        }), 401

    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Resource not found.',
            'data': None
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Internal server error: {error}')
        return jsonify({
            'success': False,
            'message': 'An internal server error occurred.',
            'data': None
        }), 500

    @app.errorhandler(413)
    def file_too_large(error):
        return jsonify({
            'success': False,
            'message': 'File is too large. Maximum size is 5MB.',
            'data': None
        }), 413

    # Health check
    @app.route('/api/health')
    def health():
        return jsonify({
            'success': True,
            'message': 'SecureVote API is running.',
            'data': None
        })

    # Start background election lifecycle scheduler
    start_background_scheduler(app)

    return app
