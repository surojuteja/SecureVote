# SecureVote — Installation Guide

## Prerequisites

| Software | Version | Download |
|----------|---------|----------|
| Python | 3.10+ | https://www.python.org/downloads/ |
| Node.js | 18+ | https://nodejs.org/ |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/ |
| Git | Latest | https://git-scm.com/ |

---

## Step-by-Step Installation

### Step 1: Install Python

**Windows:**
1. Download from https://www.python.org/downloads/
2. During installation, check **"Add Python to PATH"**
3. Verify: `python --version`

**Linux/macOS:**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install python3 python3-pip python3-venv

# macOS
brew install python
```

### Step 2: Install Node.js

**Windows:**
1. Download LTS from https://nodejs.org/
2. Run installer
3. Verify: `node --version` and `npm --version`

**Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 3: Install MySQL

**Windows:**
1. Download MySQL Installer from https://dev.mysql.com/downloads/installer/
2. Choose "Developer Default" setup
3. Set root password during setup
4. Verify: `mysql --version`

**Linux:**
```bash
sudo apt install mysql-server
sudo mysql_secure_installation
```

**macOS:**
```bash
brew install mysql
brew services start mysql
```

### Step 4: Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE secure_voting_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Step 5: Configure Environment

**Backend:**
```bash
cd secure-online-voting/backend
cp .env.example .env
```

Edit `backend/.env`:
```
FLASK_ENV=development
SECRET_KEY=your_random_secret_key_here
JWT_SECRET_KEY=your_random_jwt_key_here
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/secure_voting_db
FACE_MATCH_THRESHOLD=0.70
UPLOAD_FOLDER=uploads/faces
```

**Frontend:**
```bash
cd secure-online-voting/frontend
cp .env.example .env
```

### Step 6: Install Backend Dependencies

```bash
cd secure-online-voting/backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

> **Note**: `opencv-python` and `deepface` may take time to install. If DeepFace has issues, the system will fall back to histogram-based matching for development.

### Step 7: Install Frontend Dependencies

```bash
cd secure-online-voting/frontend
npm install
```

### Step 8: Initialize Database

```bash
cd secure-online-voting/backend
# Ensure virtual environment is activated
python seed.py
```

This creates:
- 1 admin account
- 5 voter accounts
- 2 elections (1 upcoming, 1 completed)
- 6 candidates

### Step 9: Start Backend

```bash
cd secure-online-voting/backend
# Ensure virtual environment is activated
python run.py
```

Backend runs at: **http://localhost:5000**

Verify: http://localhost:5000/api/health

### Step 10: Start Frontend

Open a new terminal:
```bash
cd secure-online-voting/frontend
npm run dev
```

Frontend runs at: **http://localhost:5173**

### Step 11: Open Browser

Navigate to: **http://localhost:5173**

---

## Testing the Application

### Step 12: Test Admin Login

1. Open http://localhost:5173
2. Click **"Admin Login"** tab
3. Username: `admin`
4. Password: `Admin@123`
5. Click **"Login"**

### Step 13: Register a Voter's Face

1. Go to **Voters** in sidebar
2. Click on a voter (e.g., VOT001 - Rahul Sharma)
3. In the **Face Enrollment** panel, allow camera access
4. Capture the voter's face photo
5. Click **"Register Face"**

### Step 14: Test Voter Login

1. Logout from admin
2. In the **"Voter Login"** tab:
   - Enter Voter ID: `VOT001`
   - Allow camera access
   - Capture your face
   - Click **"Authenticate & Login"**

### Step 15: Create an Election

1. Login as admin
2. Go to **Elections** → **Create Election**
3. Set title, dates (start now, end in 1 hour)
4. Create the election
5. Go to election detail → Add candidates

### Step 16: Cast a Vote

1. Login as voter
2. Go to **Elections**
3. Click **"Vote"** on the active election
4. Select a candidate
5. Click **"Confirm Vote"**
6. Verify confirmation screen

### Step 17: View Results

1. After election ends (or admin marks it completed)
2. Navigate to **Results**
3. View charts and winner

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError` | Ensure virtual environment is activated |
| MySQL connection refused | Verify MySQL is running and credentials are correct |
| Camera not working | Allow camera permissions in browser settings |
| DeepFace download slow | First run downloads face models (~100MB). Be patient. |
| Port 5000 in use | Change port in `run.py` or kill existing process |
| Port 5173 in use | Vite will auto-increment to 5174 |
| CORS errors | Ensure backend is running on localhost:5000 |
