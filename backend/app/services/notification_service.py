"""
Notification service for in-app notifications and bulk broadcasts.
"""
import logging
from ..extensions import get_db
from ..models.notification import Notification

logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    def get_eligible_voters():
        """Retrieve all eligible voters along with user account info."""
        db = get_db()
        voters = list(db.voters.find({'is_eligible': True}))
        voter_user_pairs = []
        for v in voters:
            user = db.users.find_one({'_id': v.get('user_id')})
            if user:
                voter_user_pairs.append({
                    'voter': v,
                    'user': user,
                    'email': user.get('email'),
                    'full_name': v.get('full_name', 'Voter'),
                    'user_id': user['_id'],
                })
        return voter_user_pairs

    @staticmethod
    def notify_election_created(election_doc):
        db = get_db()
        pairs = NotificationService.get_eligible_voters()
        notifs = []
        for p in pairs:
            notif = Notification.create_doc(
                user_id=p['user_id'],
                title='New Election Available',
                message=f'A new election "{election_doc.get("title")}" has been scheduled. Check it out!',
                notif_type='ELECTION_CREATED',
            )
            notifs.append(notif)
        if notifs:
            db.notifications.insert_many(notifs)
        logger.info(f'Notified {len(pairs)} voters about election: {election_doc.get("title")}')

    @staticmethod
    def notify_polling_reminder_30min(election_doc):
        """Broadcast 30-minute pre-polling warning in-app notification to all voters."""
        db = get_db()
        pairs = NotificationService.get_eligible_voters()
        notifs = []
        for p in pairs:
            notif = Notification.create_doc(
                user_id=p['user_id'],
                title='⏰ Polling Starts in 30 Minutes',
                message=f'Warning: Polling for "{election_doc.get("title")}" begins in 30 minutes! Please ensure your webcam is ready for facial authentication.',
                notif_type='POLLING_REMINDER_30MIN',
            )
            notifs.append(notif)
        if notifs:
            db.notifications.insert_many(notifs)
        logger.info(f'Sent 30-minute reminder notifications for election: {election_doc.get("title")}')

    @staticmethod
    def notify_polling_started(election_doc):
        """Broadcast polling started in-app notification to all voters."""
        db = get_db()
        pairs = NotificationService.get_eligible_voters()
        notifs = []
        for p in pairs:
            notif = Notification.create_doc(
                user_id=p['user_id'],
                title='🗳️ Polling Has Started',
                message=f'Polling is now live for "{election_doc.get("title")}". Exercise your vote securely!',
                notif_type='POLLING_STARTED',
            )
            notifs.append(notif)
        if notifs:
            db.notifications.insert_many(notifs)
        logger.info(f'Sent polling started notifications for election: {election_doc.get("title")}')

    @staticmethod
    def notify_election_results(election_doc, results_data):
        """Broadcast election completed outcome and certified results to every voter."""
        db = get_db()
        pairs = NotificationService.get_eligible_voters()
        
        winner = results_data.get('winner')
        winner_text = f"Winner: {winner['name']} ({winner['votes']} votes, {winner['percentage']}%)" if winner else "Certified Outcome"
        
        notifs = []
        for p in pairs:
            # Check if this particular voter voted in this election
            has_voted = db.votes.find_one({'election_id': election_doc['_id'], 'voter_id': p['voter']['_id']}) is not None
            participation_note = "Your vote was counted." if has_voted else "You did not participate."
            
            notif = Notification.create_doc(
                user_id=p['user_id'],
                title='🏆 Election Results Certified',
                message=f'Results for "{election_doc.get("title")}" are finalized. {winner_text}. ({participation_note})',
                notif_type='ELECTION_RESULTS',
            )
            notifs.append(notif)
        if notifs:
            db.notifications.insert_many(notifs)
        logger.info(f'Sent final results notifications for election: {election_doc.get("title")}')

    @staticmethod
    def notify_vote_confirmation(voter_db_id, election_doc):
        db = get_db()
        voter_doc = db.voters.find_one({'_id': voter_db_id})
        if voter_doc:
            notif = Notification.create_doc(
                user_id=voter_doc['user_id'],
                title='Vote Confirmed',
                message=f'Your vote in "{election_doc.get("title")}" has been recorded successfully.',
                notif_type='VOTE_CONFIRMATION',
            )
            db.notifications.insert_one(notif)
            logger.info(f'Vote confirmation notification sent to voter {voter_doc.get("voter_id")}')
