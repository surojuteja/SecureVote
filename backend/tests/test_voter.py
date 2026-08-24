"""
Voter management tests.
"""


class TestVoterCRUD:
    """Test voter creation, retrieval, update, deletion."""

    def test_create_voter(self, client, auth_headers):
        """Admin can create a voter."""
        res = client.post('/api/admin/voters', headers=auth_headers, json={
            'voter_id': 'VOT100', 'full_name': 'New Voter',
            'email': 'new@test.com', 'username': 'newvoter', 'password': 'Pass@123',
        })
        data = res.get_json()
        assert res.status_code == 201
        assert data['success'] is True
        assert data['data']['voter']['voter_id'] == 'VOT100'

    def test_create_voter_duplicate_id(self, client, auth_headers):
        """Cannot create voter with duplicate voter_id."""
        client.post('/api/admin/voters', headers=auth_headers, json={
            'voter_id': 'VOT200', 'full_name': 'V1',
            'email': 'v1@test.com', 'username': 'v1user', 'password': 'Pass@123',
        })
        res = client.post('/api/admin/voters', headers=auth_headers, json={
            'voter_id': 'VOT200', 'full_name': 'V2',
            'email': 'v2@test.com', 'username': 'v2user', 'password': 'Pass@123',
        })
        assert res.status_code == 400

    def test_create_voter_duplicate_email(self, client, auth_headers):
        """Cannot create voter with duplicate email."""
        client.post('/api/admin/voters', headers=auth_headers, json={
            'voter_id': 'VOT301', 'full_name': 'V1',
            'email': 'same@test.com', 'username': 'v3user', 'password': 'Pass@123',
        })
        res = client.post('/api/admin/voters', headers=auth_headers, json={
            'voter_id': 'VOT302', 'full_name': 'V2',
            'email': 'same@test.com', 'username': 'v4user', 'password': 'Pass@123',
        })
        assert res.status_code == 400

    def test_list_voters(self, client, auth_headers):
        """Admin can list voters."""
        client.post('/api/admin/voters', headers=auth_headers, json={
            'voter_id': 'VOT400', 'full_name': 'Listed Voter',
            'email': 'listed@test.com', 'username': 'listedvoter', 'password': 'Pass@123',
        })
        res = client.get('/api/admin/voters', headers=auth_headers)
        data = res.get_json()
        assert res.status_code == 200
        assert data['success'] is True
        assert len(data['data']['voters']) >= 1

    def test_create_voter_missing_fields(self, client, auth_headers):
        """Cannot create voter without required fields."""
        res = client.post('/api/admin/voters', headers=auth_headers, json={
            'voter_id': 'VOT500',
        })
        assert res.status_code == 400
