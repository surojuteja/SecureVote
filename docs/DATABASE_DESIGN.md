# SecureVote — Database Design

## Overview

SecureVote uses **MySQL 8** with **InnoDB** engine for ACID compliance and foreign key support. The database is accessed through **SQLAlchemy ORM** to prevent SQL injection.

Database: `secure_voting_db` (UTF-8 MB4)

---

## Entity-Relationship Diagram

```
┌──────────┐     1:1      ┌──────────┐     1:N      ┌──────────┐
│  users   │─────────────►│  voters  │─────────────►│  votes   │
│          │              │          │              │          │
│ PK: id   │              │ PK: id   │              │ PK: id   │
│ username │              │ voter_id │              │ election │
│ email    │              │ full_name│              │ voter_id │
│ password │              │ face_*   │              │ candidate│
│ role     │              │          │              │ voted_at │
└──────────┘              └──────────┘              └──────────┘
     │                                                   │
     │ 1:N                                               │
     ▼                                                   │
┌──────────────┐                                         │
│ notifications│                                         │
│              │                                         │
│ PK: id       │                                         │
│ user_id (FK) │                                         │
│ title        │                                         │
│ message      │                                         │
│ type         │                                         │
└──────────────┘                                         │
                                                         │
┌──────────┐     1:N      ┌──────────────┐              │
│ elections│─────────────►│  candidates  │◄─────────────┘
│          │              │              │
│ PK: id   │              │ PK: id       │
│ title    │              │ election_id  │
│ start_dt │              │ name         │
│ end_dt   │              │ party        │
│ status   │              │              │
│ created  │              │              │
└──────────┘              └──────────────┘
```

---

## Tables

### 1. users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique user ID |
| username | VARCHAR(80) | UNIQUE, NOT NULL | Login username |
| email | VARCHAR(120) | UNIQUE, NOT NULL | User email |
| password_hash | VARCHAR(256) | NOT NULL | Werkzeug hashed password |
| role | ENUM('ADMIN','VOTER') | NOT NULL, DEFAULT 'VOTER' | User role |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Account status |
| created_at | DATETIME | NOT NULL, DEFAULT NOW | Registration date |
| updated_at | DATETIME | NOT NULL, AUTO UPDATE | Last modification |

**Indexes:** `idx_users_role`, `idx_users_email`

---

### 2. voters

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Internal voter PK |
| user_id | INT | FK → users.id, UNIQUE | Linked user account |
| voter_id | VARCHAR(20) | UNIQUE, NOT NULL | Public voter identifier |
| full_name | VARCHAR(150) | NOT NULL | Full name |
| date_of_birth | DATE | NULL | Date of birth |
| phone | VARCHAR(20) | NULL | Phone number |
| address | TEXT | NULL | Address |
| face_image_path | VARCHAR(500) | NULL | Path to stored face image |
| face_embedding | BLOB | NULL | Serialized face embedding |
| is_verified | BOOLEAN | NOT NULL, DEFAULT FALSE | Face verification status |
| is_eligible | BOOLEAN | NOT NULL, DEFAULT TRUE | Voting eligibility |
| created_at | DATETIME | NOT NULL | Registration date |
| updated_at | DATETIME | NOT NULL | Last modification |

**Foreign Keys:** `user_id → users(id) ON DELETE CASCADE`
**Indexes:** `idx_voters_voter_id`, `idx_voters_eligible`

> **Privacy Note:** `face_embedding` is never exposed in API responses.

---

### 3. elections

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Election ID |
| title | VARCHAR(200) | NOT NULL | Election title |
| description | TEXT | NULL | Description |
| start_datetime | DATETIME | NOT NULL | Voting start time |
| end_datetime | DATETIME | NOT NULL | Voting end time |
| status | ENUM | NOT NULL, DEFAULT 'UPCOMING' | Current status |
| created_by | INT | FK → users.id | Admin who created |
| created_at | DATETIME | NOT NULL | Creation date |
| updated_at | DATETIME | NOT NULL | Last modification |

**Status Values:** UPCOMING, ACTIVE, COMPLETED, CANCELLED

**Foreign Keys:** `created_by → users(id)`
**Indexes:** `idx_elections_status`, `idx_elections_dates`

---

### 4. candidates

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Candidate ID |
| election_id | INT | FK → elections.id | Parent election |
| name | VARCHAR(150) | NOT NULL | Candidate name |
| party | VARCHAR(100) | NULL | Political party |
| description | TEXT | NULL | Bio/description |
| image_path | VARCHAR(500) | NULL | Candidate photo path |
| created_at | DATETIME | NOT NULL | Added date |

**Foreign Keys:** `election_id → elections(id) ON DELETE CASCADE`
**Indexes:** `idx_candidates_election`

---

### 5. votes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Vote record ID |
| election_id | INT | FK → elections.id | Election voted in |
| voter_id | INT | FK → voters.id | Voter who cast |
| candidate_id | INT | FK → candidates.id | Selected candidate |
| voted_at | DATETIME | NOT NULL, DEFAULT NOW | Timestamp |

**CRITICAL CONSTRAINT:**
```sql
UNIQUE (election_id, voter_id) — uq_one_vote_per_election
```
This prevents a voter from voting more than once per election at the database level.

**Foreign Keys:** `election_id → elections(id)`, `voter_id → voters(id)`, `candidate_id → candidates(id)`
**Indexes:** `idx_votes_election`, `idx_votes_voter`

---

### 6. notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Notification ID |
| user_id | INT | FK → users.id | Recipient |
| title | VARCHAR(200) | NOT NULL | Title |
| message | TEXT | NOT NULL | Content |
| type | ENUM | NOT NULL | Notification type |
| is_read | BOOLEAN | NOT NULL, DEFAULT FALSE | Read status |
| created_at | DATETIME | NOT NULL | Created date |

**Type Values:** ELECTION_CREATED, ELECTION_REMINDER, ELECTION_STARTED, VOTE_CONFIRMATION, ELECTION_COMPLETED, RESULTS_PUBLISHED

**Foreign Keys:** `user_id → users(id) ON DELETE CASCADE`
**Indexes:** `idx_notifications_user`, `idx_notifications_read`

---

## Relationships Summary

| Relationship | Type | Description |
|-------------|------|-------------|
| users → voters | 1:1 | Each user has at most one voter profile |
| users → notifications | 1:N | A user can have many notifications |
| elections → candidates | 1:N | An election has many candidates |
| elections → votes | 1:N | An election receives many votes |
| voters → votes | 1:N | A voter can vote in many elections |
| candidates → votes | 1:N | A candidate receives many votes |
| users → elections | 1:N | An admin creates many elections |

---

## Constraints & Integrity

1. **Referential integrity** enforced via foreign keys
2. **Unique constraints** on: username, email, voter_id, (election_id + voter_id)
3. **Cascade deletes** on: voters (when user deleted), candidates (when election deleted), notifications
4. **NOT NULL** on all critical fields
5. **ENUM types** for role, status, and notification_type
