"""
Flask extension instances.
Initialized here to avoid circular imports.
"""
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import OperationFailure

jwt = JWTManager()
cors = CORS()

# MongoDB client and database references (set during app init)
_mongo_client = None
_mongo_db = None


def init_db(app):
    """Initialize the MongoDB connection and create indexes."""
    global _mongo_client, _mongo_db
    _mongo_client = MongoClient(
        app.config['MONGO_URI'],
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
    )
    _mongo_db = _mongo_client[app.config['MONGO_DB_NAME']]

    # Create indexes for data integrity and performance
    _ensure_indexes(_mongo_db)

    app.logger.info(f"Connected to MongoDB database: {app.config['MONGO_DB_NAME']}")


def get_db():
    """Get the MongoDB database instance."""
    if _mongo_db is None:
        raise RuntimeError('Database not initialized. Call init_db(app) first.')
    return _mongo_db


def _ensure_indexes(db):
    """Create required indexes on all collections.
    Silently skips if indexes already exist.
    """
    try:
        # Users collection
        db.users.create_index('username', unique=True)
        db.users.create_index('email', unique=True)

        # Voters collection
        db.voters.create_index('voter_id', unique=True)
        db.voters.create_index('user_id', unique=True)

        # Votes collection — CRITICAL: prevent duplicate voting
        db.votes.create_index(
            [('election_id', 1), ('voter_id', 1)],
            unique=True,
            name='uq_one_vote_per_election'
        )
        db.votes.create_index('election_id')

        # Candidates collection
        db.candidates.create_index('election_id')

        # Notifications collection
        db.notifications.create_index('user_id')
    except OperationFailure:
        # Indexes already exist — safe to ignore
        pass

