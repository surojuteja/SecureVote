"""
SecureVote Backend Configuration.
Loads settings from environment variables with sensible defaults.
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 3600))
    )

    # MongoDB Atlas
    MONGO_URI = os.environ.get(
        'MONGO_URI',
        'mongodb://localhost:27017/'
    )
    MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME', 'secure_voting_db')

    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads/faces')
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB max upload
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

    FACE_MATCH_THRESHOLD = float(os.environ.get('FACE_MATCH_THRESHOLD', 0.70))


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    MONGO_DB_NAME = 'secure_voting_test_db'


config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
}
