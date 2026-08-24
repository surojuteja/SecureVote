"""
Test configuration and fixtures.
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import create_app
from app.extensions import db as _db
from app.models.user import User
from app.models.voter import Voter
from app.models.election import Election
from app.models.candidate import Candidate


@pytest.fixture(scope='session')
def app():
    """Create application for testing."""
    app = create_app('testing')
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()


@pytest.fixture(scope='function')
def db(app):
    """Provide a clean database for each test."""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.rollback()
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()


@pytest.fixture
def client(app):
    """Test client."""
    return app.test_client()


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    user = User(username='testadmin', email='admin@test.com', role='ADMIN', is_active=True)
    user.set_password('Admin@123')
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def voter_user(db):
    """Create a voter user with voter profile."""
    user = User(username='testvoter', email='voter@test.com', role='VOTER', is_active=True)
    user.set_password('Voter@123')
    db.session.add(user)
    db.session.flush()

    voter = Voter(
        user_id=user.id, voter_id='TVOT001', full_name='Test Voter',
        is_verified=True, is_eligible=True,
    )
    db.session.add(voter)
    db.session.commit()
    return user, voter


@pytest.fixture
def admin_token(client, admin_user):
    """Get JWT token for admin."""
    res = client.post('/api/auth/admin-login', json={
        'username': 'testadmin', 'password': 'Admin@123'
    })
    return res.get_json()['data']['access_token']


@pytest.fixture
def auth_headers(admin_token):
    """Auth headers for admin."""
    return {'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'}
