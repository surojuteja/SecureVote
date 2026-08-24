# SecureVote — Project Report

## Secure Face-Authenticated Online Voting System

---

## 1. Abstract

This project presents the design and implementation of a **Secure Face-Authenticated Online Voting System** (SecureVote), which leverages biometric face recognition technology to authenticate voters before allowing them to participate in electronic elections. The system addresses critical challenges in electronic voting — namely voter identity verification, vote integrity, and result transparency — by combining modern web technologies with computer vision techniques.

The application features a dual-panel architecture: an **Administration Dashboard** for managing voters, elections, and candidates, and a **Voter Portal** for authenticated voting, election browsing, and result viewing. Face authentication is implemented using OpenCV for face detection and DeepFace for embedding generation and comparison, ensuring that only registered and verified voters can access the voting system.

The system enforces ten critical voting security rules at the backend level, including one-vote-per-election enforcement through database-level unique constraints, time-based election validation, and role-based access control through JWT authentication.

> **Disclaimer:** This is an academic prototype developed for educational purposes and is NOT certified for governmental elections.

---

## 2. Introduction

Electronic voting (e-voting) systems have gained significant attention as a means to modernize democratic processes, increase voter participation, and reduce the logistical challenges of traditional paper-based voting. However, the adoption of e-voting has been hindered by concerns regarding security, voter identity verification, and the potential for fraud.

Traditional authentication methods such as passwords and PINs are susceptible to sharing, theft, and social engineering attacks. Biometric authentication, particularly face recognition, offers a more robust solution as it ties the authentication process to the voter's unique physical characteristics.

This project develops a complete online voting system that integrates face recognition technology for voter authentication, providing a secure and user-friendly platform for conducting elections electronically.

---

## 3. Problem Statement

Existing electronic voting systems face several challenges:

1. **Identity Verification:** Traditional username/password authentication cannot guarantee that the person logging in is the actual registered voter.
2. **Vote Integrity:** Without proper safeguards, votes can be duplicated, modified, or cast outside valid election periods.
3. **Transparency:** Voters and administrators need real-time visibility into election status, participation, and results.
4. **Accessibility:** Voting systems must be accessible from various devices while maintaining security.
5. **Usability:** Complex security measures often create poor user experiences that discourage participation.

---

## 4. Existing System

Current electronic voting approaches include:

- **Simple web forms** with username/password — vulnerable to credential sharing
- **OTP-based systems** — dependent on mobile networks, susceptible to SIM swapping
- **Smart card systems** — require physical infrastructure and card distribution
- **Blockchain voting** — technically complex and resource-intensive for academic deployments

These systems typically lack integrated biometric verification, making them vulnerable to impersonation attacks.

---

## 5. Proposed System

SecureVote introduces a **face-authenticated online voting system** that combines:

1. **Biometric identity verification** through live webcam face capture and comparison against registered face embeddings
2. **Role-based dual-panel architecture** with separate admin and voter interfaces
3. **Automated election lifecycle management** with time-based status computation
4. **Database-level vote integrity** through unique constraints and backend validation
5. **Real-time result calculation** with visual analytics

The system is designed as a modular, full-stack web application that can be deployed locally or on cloud infrastructure.

---

## 6. Objectives

1. Develop a secure online voting platform with face authentication
2. Implement voter registration with biometric face enrollment
3. Create an administrative panel for election and voter management
4. Build a voter portal with calendar, voting, and results functionality
5. Enforce voting security rules at both application and database levels
6. Provide real-time election result calculation with visual analytics
7. Implement an in-app notification system for election events
8. Ensure responsive design for desktop, tablet, and mobile devices
9. Document the system comprehensively for academic evaluation

---

## 7. Scope

### In Scope
- Face-based voter authentication using webcam
- Admin dashboard with comprehensive management features
- Election creation, scheduling, and lifecycle management
- Candidate management
- Secure voting with confirmation
- Automatic result calculation
- Notification system
- Responsive web interface
- REST API backend

### Out of Scope
- Blockchain integration
- Email/SMS notifications (designed for future addition)
- Multi-language support
- Native mobile applications
- Legal compliance for governmental elections
- Encrypted biometric storage (uses standard database storage)

---

## 8. System Requirements

### Hardware Requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Processor | Dual-core 2.0 GHz | Quad-core 3.0 GHz |
| RAM | 4 GB | 8 GB |
| Storage | 2 GB free | 5 GB free |
| Webcam | 640×480 | 1280×720 |
| Network | 1 Mbps | 10 Mbps |

### Software Requirements
| Software | Version |
|----------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| MySQL | 8.0+ |
| Modern Browser | Chrome 90+, Firefox 88+, Edge 90+ |

---

## 9. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR01 | Admin login with password + optional face | High |
| FR02 | Voter login with face verification | High |
| FR03 | Voter registration by admin | High |
| FR04 | Face enrollment for voters | High |
| FR05 | Election CRUD operations | High |
| FR06 | Candidate management | High |
| FR07 | Election scheduling with date/time | High |
| FR08 | Secure vote submission | Critical |
| FR09 | Duplicate vote prevention | Critical |
| FR10 | Automatic result calculation | High |
| FR11 | Winner/tie determination | High |
| FR12 | Election calendar view | Medium |
| FR13 | In-app notifications | Medium |
| FR14 | Dashboard statistics and charts | Medium |
| FR15 | Voter profile management | Low |

---

## 10. Non-Functional Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR01 | Response time | API responses < 2 seconds |
| NFR02 | Face verification time | < 5 seconds |
| NFR03 | Concurrent users | Support 50+ simultaneous |
| NFR04 | Data security | Hashed passwords, JWT tokens |
| NFR05 | Availability | 99% uptime (deployment dependent) |
| NFR06 | Usability | Intuitive UI, < 5 clicks to vote |
| NFR07 | Responsiveness | Support 320px–1920px screens |
| NFR08 | Maintainability | Modular code, documented APIs |

---

## 11. System Architecture

SecureVote follows a **three-tier architecture**:

### Presentation Tier (Frontend)
- React.js single-page application
- Vite development server
- Component-based architecture with context for state management
- Axios HTTP client with JWT interceptors

### Application Tier (Backend)
- Flask REST API server
- Blueprint-based route organization
- Service layer for business logic
- JWT-based authentication
- Face recognition service

### Data Tier
- MySQL relational database
- SQLAlchemy ORM for data access
- 6 normalized tables with foreign key relationships

---

## 12. Module Description

### Authentication Module
Handles voter and admin login, JWT token issuance, and session management. Voter authentication requires live face verification against stored embeddings.

### Face Recognition Module
Provides face detection (OpenCV Haar Cascades), embedding generation (DeepFace VGG-Face), and similarity comparison (cosine similarity). Includes fallback histogram-based matching for development environments.

### Voter Management Module
CRUD operations for voter profiles including registration, face enrollment, eligibility management, and search/filter capabilities.

### Election Management Module
Election creation with date/time scheduling, status lifecycle management (UPCOMING → ACTIVE → COMPLETED), and real-time status computation.

### Candidate Management Module
Adding, editing, and removing candidates for elections with inline form interfaces.

### Voting Module
Secure vote submission with 10 backend-enforced security rules, confirmation workflow, and database-level duplicate prevention.

### Results Module
Automatic vote counting, percentage calculation, winner determination, tie detection, and visual analytics with charts.

### Notification Module
Event-driven notification generation for election lifecycle events and vote confirmations.

---

## 13. Database Design

The database consists of 6 tables:

1. **users** — Authentication accounts with roles
2. **voters** — Voter profiles with face data
3. **elections** — Election events with scheduling
4. **candidates** — Election candidates
5. **votes** — Vote records with unique constraint
6. **notifications** — In-app notifications

Key constraint: `UNIQUE(election_id, voter_id)` on votes table prevents duplicate voting at the database level.

See [DATABASE_DESIGN.md](DATABASE_DESIGN.md) for complete schema.

---

## 14. Face Recognition Methodology

### Enrollment Process
1. Admin captures voter face via webcam
2. System validates image contains exactly one face
3. Face embedding vector is generated using DeepFace (VGG-Face model)
4. Embedding is serialized and stored in database
5. Face image is resized and saved to filesystem

### Verification Process
1. Voter enters Voter ID and activates webcam
2. Live face image is captured
3. System generates embedding from live image
4. Cosine similarity is computed between live and stored embeddings
5. If similarity ≥ threshold (default 0.70), authentication succeeds

### Technical Details
- **Detection:** OpenCV Haar Cascade Classifier
- **Embedding:** DeepFace with VGG-Face model (2622-dimensional vector)
- **Comparison:** Cosine similarity metric
- **Threshold:** Configurable via environment variable (default: 0.70)
- **Fallback:** Histogram-based comparison when DeepFace unavailable

---

## 15. Voting Workflow

1. Voter logs in using Voter ID + face verification
2. System issues JWT access token
3. Voter browses available elections
4. Voter selects an active election
5. System displays candidate list
6. Voter selects exactly one candidate
7. Confirmation modal appears with warning
8. Voter confirms selection
9. Backend validates all 10 security rules
10. Vote is recorded in database transaction
11. Confirmation notification is created
12. Voter receives reference ID

---

## 16. Security Features

| Feature | Implementation |
|---------|---------------|
| Password Storage | Werkzeug PBKDF2-SHA256 hashing |
| Session Management | JWT tokens with expiration |
| Access Control | Role-based decorators (@admin_required, @voter_required) |
| Input Validation | Server-side validation for all inputs |
| SQL Injection Prevention | SQLAlchemy parameterized queries |
| CORS | Flask-CORS with configurable origins |
| File Upload Security | Extension whitelist, size limits (5MB) |
| Duplicate Vote Prevention | Application check + DB UNIQUE constraint |
| Time Validation | Backend verifies election period for every vote |
| Data Privacy | Face embeddings never exposed in API responses |

---

## 17. Implementation

### Backend Implementation
- Flask application factory pattern
- Blueprint-based route modularization
- Service layer separating business logic from routes
- SQLAlchemy models with relationship mapping
- Custom decorators for authorization
- Standardized JSON response format

### Frontend Implementation
- React functional components with hooks
- Context API for authentication state
- React Router for client-side navigation
- Axios interceptors for token management
- Recharts for data visualization
- FullCalendar for election scheduling view
- react-webcam for camera integration

---

## 18. Testing

### Backend Tests
- Authentication tests (login, invalid credentials, protected routes)
- Voter CRUD tests (create, duplicates, validation)
- Election tests (create, invalid dates, listing)
- Voting tests (success, duplicate rejection, wrong candidate, schedule enforcement)

### Frontend Validation
- Form field validation
- Error state handling
- Loading state management
- Camera permission error handling

---

## 19. Results

The system successfully demonstrates:
- Face-authenticated voter login with configurable threshold
- Complete election lifecycle management
- Secure voting with all 10 security rules enforced
- Automatic result calculation with winner/tie detection
- Real-time dashboard statistics
- Interactive election calendar
- In-app notification system

---

## 20. Advantages

1. **Biometric security** eliminates credential sharing
2. **Automated lifecycle** reduces manual administration
3. **Database-level integrity** prevents vote tampering
4. **Responsive design** enables voting from any device
5. **Modular architecture** facilitates maintenance and extension
6. **Real-time analytics** provide immediate result visibility
7. **Notification system** keeps users informed

---

## 21. Limitations

1. Face recognition accuracy depends on lighting and camera quality
2. Requires webcam-enabled device
3. Single-server architecture (not horizontally scalable)
4. No encrypted biometric storage
5. No email/SMS notification integration
6. Academic prototype — not legally certified
7. No audit trail for vote modifications

---

## 22. Future Enhancements

1. **Blockchain integration** for immutable vote recording
2. **Encrypted biometric storage** with hardware security modules
3. **Multi-factor authentication** combining face + OTP
4. **Email/SMS notifications** for election reminders
5. **WebSocket** for real-time result streaming
6. **Multi-language** support for accessibility
7. **Mobile native apps** for iOS and Android
8. **Audit logging** for compliance
9. **Load balancing** for production deployment
10. **Advanced liveness detection** to prevent photo-based spoofing

---

## 23. Conclusion

The SecureVote system successfully demonstrates that face recognition technology can be effectively integrated into online voting platforms to enhance security and voter authentication. By combining modern web technologies (React, Flask) with computer vision libraries (OpenCV, DeepFace), the system provides a practical and user-friendly approach to secure electronic voting.

The implementation of ten backend-enforced security rules, database-level duplicate vote prevention, and comprehensive election lifecycle management shows that academic prototype systems can achieve meaningful security guarantees. While the system has limitations inherent to prototype implementations, its modular architecture provides a solid foundation for future enhancements.

---

## 24. References

1. Turk, M. and Pentland, A. (1991). "Eigenfaces for Recognition." *Journal of Cognitive Neuroscience*, 3(1), 71-86.
2. Serengil, S. I. and Ozpinar, A. (2020). "LightFace: A Hybrid Deep Face Recognition Framework." *IEEE Access*.
3. Flask Documentation. https://flask.palletsprojects.com/
4. React Documentation. https://react.dev/
5. DeepFace Library. https://github.com/serengil/deepface
6. OpenCV Documentation. https://docs.opencv.org/
7. SQLAlchemy Documentation. https://docs.sqlalchemy.org/
8. JWT Introduction. https://jwt.io/introduction
9. OWASP Web Security Testing Guide. https://owasp.org/www-project-web-security-testing-guide/
10. FullCalendar Documentation. https://fullcalendar.io/docs
