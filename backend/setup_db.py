"""
SecureVote - MongoDB Atlas Database Setup Script.
Creates all required collections and indexes in your Atlas cluster.

Usage:
    python setup_db.py

This script:
1. Connects to your MongoDB Atlas cluster
2. Creates the 'secure_voting_db' database
3. Creates 6 collections: users, voters, elections, candidates, votes, notifications
4. Creates all required indexes (unique, compound, standard)
5. Verifies the setup
"""
import os
import sys
from pymongo import MongoClient, ASCENDING
from dotenv import load_dotenv

# Fix Windows terminal encoding
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Load environment variables
load_dotenv()

MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME', 'secure_voting_db')


def setup_database():
    """Create collections and indexes in MongoDB Atlas."""
    print('=' * 60)
    print('  SecureVote - MongoDB Atlas Database Setup')
    print('=' * 60)

    # Step 1: Connect
    print(f'\n[1/4] Connecting to MongoDB Atlas...')
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=30000)
        # Test connection
        client.admin.command('ping')
        print(f'  [OK] Connected successfully!')
    except Exception as e:
        print(f'  [FAIL] Connection failed: {e}')
        print('\n  Check your MONGO_URI in .env file and ensure:')
        print('    - Username/password are correct')
        print('    - Your IP is whitelisted in Atlas Network Access')
        print('    - Cluster is active')
        sys.exit(1)

    # Step 2: Create database and collections
    print(f'\n[2/4] Creating database: {MONGO_DB_NAME}')
    db = client[MONGO_DB_NAME]

    collections = ['users', 'voters', 'elections', 'candidates', 'votes', 'notifications']
    existing = db.list_collection_names()

    for col_name in collections:
        if col_name not in existing:
            db.create_collection(col_name)
            print(f'  [OK] Created collection: {col_name}')
        else:
            print(f'  [--] Collection already exists: {col_name}')

    # Step 3: Create indexes
    print(f'\n[3/4] Creating indexes...')

    # Users indexes
    db.users.create_index('username', unique=True)
    db.users.create_index('email', unique=True)
    print('  [OK] users: unique indexes on [username, email]')

    # Voters indexes
    db.voters.create_index('voter_id', unique=True)
    db.voters.create_index('user_id', unique=True)
    print('  [OK] voters: unique indexes on [voter_id, user_id]')

    # Votes indexes - CRITICAL for preventing duplicate votes
    db.votes.create_index(
        [('election_id', ASCENDING), ('voter_id', ASCENDING)],
        unique=True,
        name='uq_one_vote_per_election'
    )
    db.votes.create_index('election_id')
    print('  [OK] votes: compound unique index on [election_id + voter_id]')
    print('           standard index on [election_id]')

    # Candidates indexes
    db.candidates.create_index('election_id')
    print('  [OK] candidates: standard index on [election_id]')

    # Notifications indexes
    db.notifications.create_index('user_id')
    print('  [OK] notifications: standard index on [user_id]')

    # Step 4: Verify
    print(f'\n[4/4] Verifying setup...')
    final_collections = sorted(db.list_collection_names())
    print(f'  Database: {MONGO_DB_NAME}')
    print(f'  Collections: {", ".join(final_collections)}')

    for col_name in collections:
        indexes = db[col_name].index_information()
        idx_names = [name for name in indexes.keys() if name != '_id_']
        print(f'    {col_name}: {len(idx_names)} index(es) -- {", ".join(idx_names) if idx_names else "none"}')

    print('\n' + '=' * 60)
    print('  [DONE] Database setup complete!')
    print('=' * 60)
    print('\nNext steps:')
    print('  1. Seed demo data:    python seed.py')
    print('  2. Start the server:  python run.py')
    print('  3. Open frontend:     http://localhost:5173/')
    print('  4. Admin login:       admin / Admin@123')

    client.close()


if __name__ == '__main__':
    setup_database()

