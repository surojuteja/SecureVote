"""
Election and voting tests.
"""
from datetime import datetime, timedelta
from app.models.election import Election
from app.models.candidate import Candidate
from app.models.voter import Voter
from app.models.vote import Vote
from app.models.user import User


class TestElectionCRUD:
    """Test election management."""

    def test_create_election(self, client, auth_headers):
        """Admin can create an election."""
        now = datetime.utcnow()
        res = client.post('/api/elections', headers=auth_headers, json={
            'title': 'Test Election',
            'description': 'A test election',
            'start_datetime': (now + timedelta(days=1)).isoformat(),
            'end_datetime': (now + timedelta(days=2)).isoformat(),
        })
        data = res.get_json()
        assert res.status_code == 201
        assert data['success'] is True
        assert data['data']['election']['title'] == 'Test Election'

    def test_create_election_invalid_dates(self, client, auth_headers):
        """Cannot create election with end before start."""
        now = datetime.utcnow()
        res = client.post('/api/elections', headers=auth_headers, json={
            'title': 'Bad Dates',
            'start_datetime': (now + timedelta(days=2)).isoformat(),
            'end_datetime': (now + timedelta(days=1)).isoformat(),
        })
        assert res.status_code == 400

    def test_list_elections(self, client, auth_headers):
        """Can list elections."""
        res = client.get('/api/elections', headers=auth_headers)
        assert res.status_code == 200


class TestVoting:
    """Test voting workflow."""

    def _setup_active_election(self, db, admin_id):
        """Helper to create an active election with candidates."""
        now = datetime.utcnow()
        election = Election(
            title='Active Test Election',
            start_datetime=now - timedelta(hours=1),
            end_datetime=now + timedelta(hours=23),
            status='ACTIVE',
            created_by=admin_id,
        )
        db.session.add(election)
        db.session.flush()

        c1 = Candidate(election_id=election.id, name='Candidate A', party='Party X')
        c2 = Candidate(election_id=election.id, name='Candidate B', party='Party Y')
        db.session.add_all([c1, c2])
        db.session.commit()
        return election, c1, c2

    def test_cast_vote_success(self, client, db, admin_user, voter_user):
        """Eligible voter can cast a vote."""
        user, voter = voter_user
        election, c1, c2 = self._setup_active_election(db, admin_user.id)

        # Get voter token via admin-login workaround (since face isn't available in tests)
        from flask_jwt_extended import create_access_token
        from flask import current_app
        with current_app.app_context():
            token = create_access_token(identity=user.id)

        res = client.post('/api/votes', headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        }, json={
            'election_id': election.id,
            'candidate_id': c1.id,
        })
        data = res.get_json()
        assert res.status_code == 201
        assert data['success'] is True
        assert 'reference_id' in data['data']

    def test_duplicate_vote_rejected(self, client, db, admin_user, voter_user):
        """Voter cannot vote twice in the same election."""
        user, voter = voter_user
        election, c1, c2 = self._setup_active_election(db, admin_user.id)

        from flask_jwt_extended import create_access_token
        from flask import current_app
        with current_app.app_context():
            token = create_access_token(identity=user.id)

        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

        # First vote succeeds
        res1 = client.post('/api/votes', headers=headers, json={
            'election_id': election.id, 'candidate_id': c1.id,
        })
        assert res1.status_code == 201

        # Second vote fails
        res2 = client.post('/api/votes', headers=headers, json={
            'election_id': election.id, 'candidate_id': c2.id,
        })
        assert res2.status_code == 400
        assert 'already voted' in res2.get_json()['message'].lower()

    def test_vote_wrong_candidate(self, client, db, admin_user, voter_user):
        """Cannot vote for candidate not in the election."""
        user, voter = voter_user
        election, c1, c2 = self._setup_active_election(db, admin_user.id)

        # Create another election with its own candidate
        now = datetime.utcnow()
        other_election = Election(
            title='Other', start_datetime=now - timedelta(hours=1),
            end_datetime=now + timedelta(hours=23), status='ACTIVE', created_by=admin_user.id,
        )
        db.session.add(other_election)
        db.session.flush()
        other_candidate = Candidate(election_id=other_election.id, name='Other', party='Z')
        db.session.add(other_candidate)
        db.session.commit()

        from flask_jwt_extended import create_access_token
        from flask import current_app
        with current_app.app_context():
            token = create_access_token(identity=user.id)

        res = client.post('/api/votes', headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        }, json={
            'election_id': election.id,
            'candidate_id': other_candidate.id,
        })
        assert res.status_code == 400

    def test_vote_upcoming_election(self, client, db, admin_user, voter_user):
        """Cannot vote in an upcoming election."""
        user, voter = voter_user
        now = datetime.utcnow()
        election = Election(
            title='Future', start_datetime=now + timedelta(days=5),
            end_datetime=now + timedelta(days=6), status='UPCOMING', created_by=admin_user.id,
        )
        db.session.add(election)
        db.session.flush()
        c = Candidate(election_id=election.id, name='C', party='P')
        db.session.add(c)
        db.session.commit()

        from flask_jwt_extended import create_access_token
        from flask import current_app
        with current_app.app_context():
            token = create_access_token(identity=user.id)

        res = client.post('/api/votes', headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
        }, json={'election_id': election.id, 'candidate_id': c.id})
        assert res.status_code == 400
