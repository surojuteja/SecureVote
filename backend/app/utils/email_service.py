import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger(__name__)

def _send_smtp_email(to_email, subject, body_text):
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    smtp_from = os.environ.get('SMTP_FROM_EMAIL', smtp_user)

    if not smtp_user or not smtp_password:
        logger.warning(f'SMTP credentials not configured. Mocking email delivery to {to_email} (Subject: {subject})')
        return True

    msg = MIMEMultipart()
    msg['From'] = smtp_from
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body_text, 'plain'))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        logger.info(f'Sent email to {to_email}: {subject}')
        return True
    except Exception as e:
        logger.error(f'Failed to send email to {to_email}: {str(e)}')
        return False


def send_voter_id_email(to_email, full_name, voter_id):
    subject = 'Your SecureVote Registration is Approved'
    body = f"""Hello {full_name},

Your registration for SecureVote has been approved by the election administrator.

You can now log in using your registered face biometrics and the following Voter ID:

Voter ID: {voter_id}

Please keep this Voter ID safe as it is required for your authentication.

Regards,
SecureVote Electoral Commission
"""
    return _send_smtp_email(to_email, subject, body)


def send_election_reminder_30min_email(to_email, full_name, election_title, start_datetime):
    subject = f'⏰ WARNING: Polling Starts in 30 Minutes — {election_title}'
    body = f"""Hello {full_name},

This is an important reminder that polling for the election "{election_title}" will begin in 30 minutes!

Election: {election_title}
Polling Start Time: {start_datetime}

Please prepare your device with a functioning webcam and ensure you are in a well-lit area for biometric facial authentication.

Log in to your SecureVote portal to be ready when polling opens:
http://localhost:5173/voter/dashboard

Regards,
SecureVote Electoral Commission
"""
    return _send_smtp_email(to_email, subject, body)


def send_election_started_email(to_email, full_name, election_title, end_datetime=None):
    subject = f'🗳️ Polling Has Started: {election_title}'
    end_info = f"\nVoting Closes At: {end_datetime}" if end_datetime else ""
    body = f"""Hello {full_name},

Polling has officially started for the election: {election_title}.{end_info}

Every vote counts. Please log in to the SecureVote portal to verify your identity with face authentication and cast your ballot.

Cast your vote here:
http://localhost:5173/voter/elections

Regards,
SecureVote Electoral Commission
"""
    return _send_smtp_email(to_email, subject, body)


def send_election_created_email(to_email, full_name, election_title, start_date, end_date):
    subject = f'New Election Scheduled: {election_title}'
    body = f"""Hello {full_name},

A new election has been scheduled on the SecureVote platform:

Election: {election_title}
Start Date/Time: {start_date}
End Date/Time: {end_date}

You can register as a candidate for this election before polling commences.
Log in to your account to review candidates and application details.

Regards,
SecureVote Electoral Commission
"""
    return _send_smtp_email(to_email, subject, body)


def send_election_results_email(to_email, full_name, election_title, winner_name, winner_votes, winner_percentage, total_votes, participation_rate):
    subject = f'🏆 Official Results Certified: {election_title}'
    winner_text = f"Winner: {winner_name} ({winner_votes} votes — {winner_percentage}%)" if winner_name else "Result: Tie / Certified"
    body = f"""Hello {full_name},

The voting window for the election "{election_title}" has ended and the official results have been cryptographically certified.

--- ELECTION OUTCOME ---
Election: {election_title}
{winner_text}
Total Votes Cast: {total_votes}
Voter Participation: {participation_rate}%

You can view the full detailed breakdown and verify your cryptographic ballot receipt online:
http://localhost:5173/voter/results

Thank you for participating in the democratic process.

Regards,
SecureVote Electoral Commission
"""
    return _send_smtp_email(to_email, subject, body)
