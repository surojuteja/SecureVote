-- ============================================================
-- SecureVote Database Schema
-- Secure Face-Authenticated Online Voting System
-- ============================================================
-- ACADEMIC PROJECT: NOT for production/governmental elections
-- ============================================================

CREATE DATABASE IF NOT EXISTS secure_voting_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE secure_voting_db;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    role ENUM('ADMIN', 'VOTER') NOT NULL DEFAULT 'VOTER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- ============================================================
-- VOTERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS voters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    voter_id VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    date_of_birth DATE NULL,
    phone VARCHAR(20) NULL,
    address TEXT NULL,
    face_image_path VARCHAR(500) NULL,
    face_embedding BLOB NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_voters_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_voters_voter_id (voter_id),
    INDEX idx_voters_eligible (is_eligible)
) ENGINE=InnoDB;

-- ============================================================
-- ELECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS elections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    status ENUM('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'UPCOMING',
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_elections_creator FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_elections_status (status),
    INDEX idx_elections_dates (start_datetime, end_datetime)
) ENGINE=InnoDB;

-- ============================================================
-- CANDIDATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    election_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    party VARCHAR(100) NULL,
    description TEXT NULL,
    image_path VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_candidates_election FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
    INDEX idx_candidates_election (election_id)
) ENGINE=InnoDB;

-- ============================================================
-- VOTES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    election_id INT NOT NULL,
    voter_id INT NOT NULL,
    candidate_id INT NOT NULL,
    voted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_votes_election FOREIGN KEY (election_id) REFERENCES elections(id),
    CONSTRAINT fk_votes_voter FOREIGN KEY (voter_id) REFERENCES voters(id),
    CONSTRAINT fk_votes_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    CONSTRAINT uq_one_vote_per_election UNIQUE (election_id, voter_id),
    INDEX idx_votes_election (election_id),
    INDEX idx_votes_voter (voter_id)
) ENGINE=InnoDB;

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('ELECTION_CREATED', 'ELECTION_REMINDER', 'ELECTION_STARTED', 'VOTE_CONFIRMATION', 'ELECTION_COMPLETED', 'RESULTS_PUBLISHED') NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read)
) ENGINE=InnoDB;
