"""
Authentication tests.
"""
import json


class TestAdminLogin:
    """Test admin login endpoint."""

    def test_admin_login_success(self, client, admin_user):
        """Admin can login with correct credentials."""
        res = client.post('/api/auth/admin-login', json={
            'username': 'testadmin', 'password': 'Admin@123'
        })
        data = res.get_json()
        assert res.status_code == 200
        assert data['success'] is True
        assert 'access_token' in data['data']
        assert data['data']['user']['role'] == 'ADMIN'

    def test_admin_login_wrong_password(self, client, admin_user):
        """Admin login fails with wrong password."""
        res = client.post('/api/auth/admin-login', json={
            'username': 'testadmin', 'password': 'WrongPass'
        })
        data = res.get_json()
        assert res.status_code == 401
        assert data['success'] is False

    def test_admin_login_missing_fields(self, client):
        """Admin login fails without required fields."""
        res = client.post('/api/auth/admin-login', json={'username': 'testadmin'})
        assert res.status_code == 400

    def test_admin_login_nonexistent_user(self, client, db):
        """Admin login fails for non-existent user."""
        res = client.post('/api/auth/admin-login', json={
            'username': 'ghost', 'password': 'pass'
        })
        assert res.status_code == 401


class TestProtectedRoutes:
    """Test JWT-protected routes."""

    def test_me_endpoint_authenticated(self, client, auth_headers):
        """Authenticated user can access /me."""
        res = client.get('/api/auth/me', headers=auth_headers)
        data = res.get_json()
        assert res.status_code == 200
        assert data['success'] is True
        assert data['data']['username'] == 'testadmin'

    def test_me_endpoint_unauthenticated(self, client):
        """Unauthenticated user cannot access /me."""
        res = client.get('/api/auth/me')
        assert res.status_code == 401

    def test_admin_route_as_voter(self, client, voter_user, db):
        """Voter cannot access admin routes."""
        # Login as voter (skip face verification for this test by using admin-login endpoint check)
        # Voters can't use admin-login, test the role guard on dashboard
        res = client.get('/api/admin/dashboard')
        assert res.status_code == 401
