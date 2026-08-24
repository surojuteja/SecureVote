"""
SecureVote Database Seeder (DEVELOPMENT ONLY).
Seeds the database with sample admin, voters, elections, and candidates.

WARNING: These credentials are for development/testing only.
"""
import os
import sys
from datetime import datetime, timedelta

# Fix Windows terminal encoding for Unicode characters
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import get_db
from app.models.user import User
from app.models.voter import Voter
from app.models.election import Election
from app.models.candidate import Candidate
from app.models.notification import Notification


def seed_database():
    """Seed the database with development data."""
    app = create_app('development')

    with app.app_context():
        db = get_db()

        print('Checking database...')

        # Check if already seeded
        if db.users.find_one({'username': 'admin'}):
            print('Database already seeded. Skipping.')
            return

        print('Seeding database...')

        # ==================== ADMIN ====================
        admin_doc = User.create_doc(
            username='admin',
            email='admin@example.com',
            role='ADMIN',
            is_active=True,
            password='Admin@123',
        )
        admin_result = db.users.insert_one(admin_doc)
        admin_id = admin_result.inserted_id

        print(f'  [OK] Admin created: admin / Admin@123')

        # ==================== VOTERS ====================
        voters_data = [
            {
                'voter_id': 'VOT001', 'full_name': 'Rahul Sharma',
                'email': 'rahul@example.com', 'username': 'rahul',
                'phone': '9876543210', 'dob': '1998-05-15',
                'address': '123 Main Street, Delhi'
            },
            {
                'voter_id': 'VOT002', 'full_name': 'Priya Patel',
                'email': 'priya@example.com', 'username': 'priya',
                'phone': '9876543211', 'dob': '1999-08-22',
                'address': '456 Park Avenue, Mumbai'
            },
            {
                'voter_id': 'VOT003', 'full_name': 'Amit Kumar',
                'email': 'amit@example.com', 'username': 'amit',
                'phone': '9876543212', 'dob': '1997-03-10',
                'address': '789 Lake Road, Bangalore'
            },
            {
                'voter_id': 'VOT004', 'full_name': 'Sneha Reddy',
                'email': 'sneha@example.com', 'username': 'sneha',
                'phone': '9876543213', 'dob': '2000-11-05',
                'address': '321 Hill View, Hyderabad'
            },
            {
                'voter_id': 'VOT005', 'full_name': 'Vikram Singh',
                'email': 'vikram@example.com', 'username': 'vikram',
                'phone': '9876543214', 'dob': '1996-07-30',
                'address': '654 River Side, Chennai'
            },
        ]

        for vd in voters_data:
            user_doc = User.create_doc(
                username=vd['username'],
                email=vd['email'],
                role='VOTER',
                is_active=True,
                password='Voter@123',
            )
            user_result = db.users.insert_one(user_doc)
            user_id = user_result.inserted_id

            voter_doc = Voter.create_doc(
                user_id=user_id,
                voter_id=vd['voter_id'],
                full_name=vd['full_name'],
                date_of_birth=vd['dob'],
                phone=vd['phone'],
                address=vd['address'],
                is_verified=False,
                is_eligible=True,
            )
            db.voters.insert_one(voter_doc)
            print(f'  [OK] Voter created: {vd["voter_id"]} ({vd["full_name"]}) / Voter@123')

        # ==================== ELECTIONS ====================
        now = datetime.utcnow()

        # Election 1: Upcoming
        election1_doc = Election.create_doc(
            title='Student Council President Election 2026',
            description='Annual election for the position of Student Council President. All eligible students can vote for their preferred candidate.',
            start_datetime=now + timedelta(days=7),
            end_datetime=now + timedelta(days=8),
            created_by=admin_id,
            status='UPCOMING',
        )
        e1_result = db.elections.insert_one(election1_doc)
        e1_id = e1_result.inserted_id

        # Candidates for Election 1
        candidates_e1 = [
            Candidate.create_doc(election_id=e1_id, name='Arjun Mehta', party='Progress Party', description='Focused on improving campus infrastructure and digital learning.'),
            Candidate.create_doc(election_id=e1_id, name='Kavya Nair', party='Unity Alliance', description='Advocating for inclusive policies and student welfare programs.'),
            Candidate.create_doc(election_id=e1_id, name='Rohan Das', party='Innovation Front', description='Promoting technology-driven solutions for academic excellence.'),
        ]
        db.candidates.insert_many(candidates_e1)

        # Election 2: Completed (past)
        election2_doc = Election.create_doc(
            title='Department Representative Election 2025',
            description='Election for department representatives. Results have been published.',
            start_datetime=now - timedelta(days=30),
            end_datetime=now - timedelta(days=29),
            created_by=admin_id,
            status='COMPLETED',
        )
        e2_result = db.elections.insert_one(election2_doc)
        e2_id = e2_result.inserted_id

        # Candidates for Election 2
        candidates_e2 = [
            Candidate.create_doc(election_id=e2_id, name='Sita Ram', party='Academic Excellence', description='Champion of academic standards and research funding.'),
            Candidate.create_doc(election_id=e2_id, name='Mohan Lal', party='Student First', description='Prioritizing student needs and campus life improvements.'),
            Candidate.create_doc(election_id=e2_id, name='Deepa Joshi', party='Green Campus', description='Environmental sustainability and green campus initiatives.'),
        ]
        db.candidates.insert_many(candidates_e2)

        print(f'  [OK] Elections created: 2 (1 upcoming, 1 completed)')
        print(f'  [OK] Candidates created: 6 (3 per election)')

        # ==================== SAMPLE NOTIFICATION ====================
        notif_doc = Notification.create_doc(
            user_id=admin_id,
            title='Welcome to SecureVote',
            message='Welcome to the SecureVote administration panel. Start by registering voters and creating elections.',
            notif_type='ELECTION_CREATED',
        )
        db.notifications.insert_one(notif_doc)

        print('\n[DONE] Database seeded successfully!')
        print('\n--- Development Credentials ---')
        print('Admin:  admin / Admin@123')
        print('Voters: rahul, priya, amit, sneha, vikram / Voter@123')
        print('(Voters need face enrollment before they can login)')


if __name__ == '__main__':
    seed_database()
