# SecureVote — API Documentation

Base URL: `http://localhost:5000/api`

All responses follow a consistent format:
```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": {} | null
}
```

---

## Authentication

### POST /auth/login
**Voter login with face verification.**

- **Auth:** None
- **Body:**
```json
{
  "voter_id": "VOT001",
  "face_image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```
- **Success (200):**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "access_token": "eyJhbG...",
    "user": { "id": 2, "username": "rahul", "role": "VOTER" },
    "voter": { "voter_id": "VOT001", "full_name": "Rahul Sharma" }
  }
}
```
- **Errors:** 401 (invalid ID, face mismatch, inactive), 500 (processing error)

---

### POST /auth/admin-login
**Admin login with password + optional face.**

- **Auth:** None
- **Body:**
```json
{
  "username": "admin",
  "password": "Admin@123",
  "face_image": null
}
```
- **Success (200):** Same format as voter login (without voter field)
- **Errors:** 401 (invalid credentials, face mismatch)

---

### POST /auth/face-verify
**Standalone face verification.**

- **Auth:** None
- **Body:** `{ "voter_id": "VOT001", "face_image": "base64..." }`
- **Success (200):** `{ "is_match": true, "confidence": 0.85 }`

---

### GET /auth/me
**Get current user info.**

- **Auth:** JWT Required
- **Success (200):** User object + voter profile if applicable

---

### POST /auth/logout
**Logout (invalidate on client side).**

- **Auth:** JWT Required
- **Success (200):** `{ "message": "Logged out successfully." }`

---

## Admin

### GET /admin/dashboard
**Dashboard statistics.**

- **Auth:** Admin JWT
- **Success (200):**
```json
{
  "data": {
    "total_voters": 5,
    "eligible_voters": 5,
    "verified_voters": 3,
    "active_elections": 1,
    "upcoming_elections": 1,
    "completed_elections": 1,
    "total_votes": 12,
    "recent_activity": [...]
  }
}
```

---

### GET /admin/voters
**List voters with search/filter.**

- **Auth:** Admin JWT
- **Query Params:** `search`, `status` (eligible|ineligible|verified|unverified), `page`, `per_page`
- **Success (200):** `{ "voters": [...], "total": 5, "page": 1, "pages": 1 }`

---

### POST /admin/voters
**Create a new voter.**

- **Auth:** Admin JWT
- **Body:**
```json
{
  "voter_id": "VOT006",
  "full_name": "New Voter",
  "email": "new@example.com",
  "username": "newvoter",
  "password": "Pass@123",
  "phone": "9876543215",
  "date_of_birth": "1999-01-15",
  "address": "123 Street"
}
```
- **Success (201):** Created user + voter objects
- **Errors:** 400 (validation, duplicates)

---

### GET /admin/voters/:id
**Get voter details.**

- **Auth:** Admin JWT
- **Success (200):** Voter + user objects

---

### PUT /admin/voters/:id
**Update voter.**

- **Auth:** Admin JWT
- **Body:** Partial voter fields to update
- **Success (200):** Updated voter

---

### DELETE /admin/voters/:id
**Deactivate voter (soft delete).**

- **Auth:** Admin JWT
- **Success (200):** Confirmation message

---

### POST /admin/voters/:id/enroll-face
**Register voter face for authentication.**

- **Auth:** Admin JWT
- **Body:** `{ "face_image": "base64..." }`
- **Success (200):** Updated voter with `is_verified: true`
- **Errors:** 400 (no face, multiple faces, poor image)

---

### GET /admin/results/:election_id
**Get election results (admin view).**

- **Auth:** Admin JWT
- **Success (200):** Full results with winner, participation, candidate breakdown

---

## Elections

### GET /elections
**List all elections.**

- **Auth:** Any JWT
- **Query Params:** `status` (UPCOMING|ACTIVE|COMPLETED|CANCELLED)
- **Success (200):** `{ "elections": [...] }`

---

### POST /elections
**Create election.**

- **Auth:** Admin JWT
- **Body:**
```json
{
  "title": "Student Election 2026",
  "description": "Annual election...",
  "start_datetime": "2026-08-15T09:00:00",
  "end_datetime": "2026-08-15T17:00:00"
}
```
- **Success (201):** Created election object
- **Errors:** 400 (invalid dates, missing fields)

---

### GET /elections/:id
**Get election with candidates.**

- **Auth:** Any JWT
- **Success (200):** Election + candidates array

---

### PUT /elections/:id
**Update election.**

- **Auth:** Admin JWT
- **Body:** Partial election fields (including `status` to change lifecycle)

---

### DELETE /elections/:id
**Delete/cancel election.**

- **Auth:** Admin JWT
- **Note:** Elections with votes are cancelled instead of deleted

---

## Candidates

### GET /elections/:id/candidates
- **Auth:** Any JWT
- **Success (200):** `{ "candidates": [...] }`

### POST /elections/:id/candidates
- **Auth:** Admin JWT
- **Body:** `{ "name": "...", "party": "...", "description": "..." }`
- **Success (201):** Created candidate

### PUT /candidates/:id
- **Auth:** Admin JWT
- **Body:** Partial candidate fields

### DELETE /candidates/:id
- **Auth:** Admin JWT
- **Note:** Cannot delete from active/completed elections

---

## Voting

### POST /votes
**Cast a vote.**

- **Auth:** Voter JWT
- **Body:**
```json
{
  "election_id": 1,
  "candidate_id": 3
}
```
- **Success (201):**
```json
{
  "data": {
    "vote_id": 1,
    "election_title": "Student Election 2026",
    "voted_at": "2026-08-15T10:30:00",
    "reference_id": "VT-000001"
  }
}
```
- **Errors:** 400 (10+ validation rules — see Security Rules in README)

---

### GET /voter/voting-status/:election_id
**Check if voter has voted.**

- **Auth:** Voter JWT
- **Success (200):** `{ "has_voted": true, "voted_at": "...", "election_status": "ACTIVE" }`

---

### GET /voter/elections
**Voter's election list (excludes cancelled).**

- **Auth:** Voter JWT

### GET /voter/elections/:id
**Election detail for voter (with candidates).**

- **Auth:** Voter JWT

---

## Results

### GET /results/:election_id
**Get election results (available after completion).**

- **Auth:** Any JWT
- **Success (200):**
```json
{
  "data": {
    "election": {...},
    "results": [
      { "name": "Candidate A", "votes": 45, "percentage": 45.0 },
      { "name": "Candidate B", "votes": 35, "percentage": 35.0 }
    ],
    "total_votes": 100,
    "total_eligible_voters": 150,
    "participation_percentage": 66.67,
    "result_status": "Winner declared",
    "winner": { "name": "Candidate A", "votes": 45 },
    "is_tie": false
  }
}
```
- **Errors:** 403 (results not available until election ends)

---

## Notifications

### GET /notifications
- **Auth:** Any JWT
- **Success (200):** `{ "notifications": [...], "unread_count": 3 }`

### PUT /notifications/:id/read
- **Auth:** Any JWT
- **Success (200):** Confirmation

### PUT /notifications/read-all
- **Auth:** Any JWT
- **Success (200):** Confirmation

---

## Health Check

### GET /health
- **Auth:** None
- **Success (200):** `{ "message": "SecureVote API is running." }`
