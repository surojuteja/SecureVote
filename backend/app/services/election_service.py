"""
Election-related business logic and lifecycle management.
"""
import logging
from datetime import datetime, timedelta
from threading import Thread
from ..extensions import get_db
from ..models.candidate import Candidate
from ..models.vote import Vote
from ..models.election import Election
from .notification_service import NotificationService
from ..utils.email_service import (
    send_election_reminder_30min_email,
    send_election_started_email,
    send_election_results_email,
)

logger = logging.getLogger(__name__)


class ElectionService:
    @staticmethod
    def calculate_results(election_doc):
        """Calculate complete certified election results."""
        db = get_db()
        candidates = list(db.candidates.find({'election_id': election_doc['_id']}))
        total_votes = db.votes.count_documents({'election_id': election_doc['_id']})
        total_eligible_voters = db.voters.count_documents({'is_eligible': True})

        results = []
        for c in candidates:
            votes = db.votes.count_documents({
                'election_id': election_doc['_id'],
                'candidate_id': c['_id']
            })
            percentage = round((votes / total_votes * 100), 2) if total_votes > 0 else 0
            results.append({
                'candidate_id': str(c['_id']),
                'name': c.get('name'),
                'party': c.get('party'),
                'description': c.get('description'),
                'votes': votes,
                'percentage': percentage,
            })

        results.sort(key=lambda x: x['votes'], reverse=True)

        winner = None
        is_tie = False
        if results and total_votes > 0:
            if len(results) > 1 and results[0]['votes'] == results[1]['votes']:
                is_tie = True
            else:
                winner = results[0]

        participation_percentage = round((total_votes / total_eligible_voters * 100), 2) if total_eligible_voters > 0 else 0

        return {
            'election_id': str(election_doc['_id']),
            'title': election_doc.get('title'),
            'description': election_doc.get('description'),
            'start_datetime': election_doc['start_datetime'].isoformat() if election_doc.get('start_datetime') else None,
            'end_datetime': election_doc['end_datetime'].isoformat() if election_doc.get('end_datetime') else None,
            'status': Election.computed_status(election_doc),
            'total_votes': total_votes,
            'total_eligible_voters': total_eligible_voters,
            'participation_percentage': participation_percentage,
            'winner': winner,
            'is_tie': is_tie,
            'results': results,
        }

    @staticmethod
    def trigger_30min_reminder(app, election_doc):
        """Send 30-minute reminder emails and in-app notifications to all voters."""
        def _send(app, doc):
            with app.app_context():
                db = get_db()
                NotificationService.notify_polling_reminder_30min(doc)
                pairs = NotificationService.get_eligible_voters()
                start_str = doc['start_datetime'].strftime('%Y-%m-%d %H:%M:%S UTC') if isinstance(doc.get('start_datetime'), datetime) else str(doc.get('start_datetime'))
                for p in pairs:
                    if p.get('email'):
                        send_election_reminder_30min_email(
                            to_email=p['email'],
                            full_name=p['full_name'],
                            election_title=doc.get('title'),
                            start_datetime=start_str
                        )
                db.elections.update_one({'_id': doc['_id']}, {'$set': {'reminder_30min_sent': True}})
                logger.info(f"30-minute reminder emails dispatched for election {doc.get('title')}")

        Thread(target=_send, args=(app, election_doc)).start()

    @staticmethod
    def trigger_polling_started(app, election_doc):
        """Send polling started emails and in-app notifications to all voters."""
        def _send(app, doc):
            with app.app_context():
                db = get_db()
                NotificationService.notify_polling_started(doc)
                pairs = NotificationService.get_eligible_voters()
                end_str = doc['end_datetime'].strftime('%Y-%m-%d %H:%M:%S UTC') if isinstance(doc.get('end_datetime'), datetime) else str(doc.get('end_datetime'))
                for p in pairs:
                    if p.get('email'):
                        send_election_started_email(
                            to_email=p['email'],
                            full_name=p['full_name'],
                            election_title=doc.get('title'),
                            end_datetime=end_str
                        )
                db.elections.update_one({'_id': doc['_id']}, {'$set': {'started_email_sent': True, 'status': 'ACTIVE'}})
                logger.info(f"Polling started emails dispatched for election {doc.get('title')}")

        Thread(target=_send, args=(app, election_doc)).start()

    @staticmethod
    def trigger_election_completed_results(app, election_doc):
        """Calculate final results, notify every voter via in-app and email with certified outcome."""
        def _send(app, doc):
            with app.app_context():
                db = get_db()
                results_data = ElectionService.calculate_results(doc)
                NotificationService.notify_election_results(doc, results_data)
                pairs = NotificationService.get_eligible_voters()
                
                winner = results_data.get('winner')
                winner_name = winner['name'] if winner else None
                winner_votes = winner['votes'] if winner else 0
                winner_pct = winner['percentage'] if winner else 0

                for p in pairs:
                    if p.get('email'):
                        send_election_results_email(
                            to_email=p['email'],
                            full_name=p['full_name'],
                            election_title=doc.get('title'),
                            winner_name=winner_name,
                            winner_votes=winner_votes,
                            winner_percentage=winner_pct,
                            total_votes=results_data['total_votes'],
                            participation_rate=results_data['participation_percentage']
                        )
                db.elections.update_one({'_id': doc['_id']}, {'$set': {'results_notified': True, 'status': 'COMPLETED'}})
                logger.info(f"Election completed results dispatched to all voters for {doc.get('title')}")

        Thread(target=_send, args=(app, election_doc)).start()

    @staticmethod
    def process_lifecycle_checks(app):
        """Periodic background check for 30m reminders, polling start, and election completion."""
        with app.app_context():
            db = get_db()
            now = datetime.utcnow()
            in_30m = now + timedelta(minutes=30)

            # 1. Check for 30-minute reminder (start_datetime <= now + 30m, but start_datetime > now)
            upcoming_soon = list(db.elections.find({
                'status': {'$ne': 'CANCELLED'},
                'start_datetime': {'$gte': now, '$lte': in_30m},
                'reminder_30min_sent': {'$ne': True}
            }))
            for e in upcoming_soon:
                logger.info(f"Triggering 30m warning for election: {e.get('title')}")
                ElectionService.trigger_30min_reminder(app, e)

            # 2. Check for polling started (now >= start_datetime and now < end_datetime)
            active_pending = list(db.elections.find({
                'status': {'$ne': 'CANCELLED'},
                'start_datetime': {'$lte': now},
                'end_datetime': {'$gt': now},
                'started_email_sent': {'$ne': True}
            }))
            for e in active_pending:
                logger.info(f"Triggering polling started notification for election: {e.get('title')}")
                ElectionService.trigger_polling_started(app, e)

            # 3. Check for election completed (now >= end_datetime)
            completed_pending = list(db.elections.find({
                'status': {'$ne': 'CANCELLED'},
                'end_datetime': {'$lte': now},
                'results_notified': {'$ne': True}
            }))
            for e in completed_pending:
                logger.info(f"Triggering certified results distribution for election: {e.get('title')}")
                ElectionService.trigger_election_completed_results(app, e)
