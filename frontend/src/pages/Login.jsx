import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Lock, Fingerprint, Eye, EyeOff, Vote, CheckCircle2, ShieldCheck, Sparkles, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import WebcamCapture from '../components/WebcamCapture'
import authService from '../services/authService'

export default function Login() {
  const [loginType, setLoginType] = useState('voter')
  const [voterId, setVoterId] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [verificationStatus, setVerificationStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleCapture = async (imageSrc) => {
    setCapturedImage(imageSrc)
    if (loginType === 'voter') {
      if (!voterId.trim()) {
        addToast('Please enter your Voter ID before biometric capture.', 'warning')
        setCapturedImage(null)
        return
      }
      setVerificationStatus('verifying')
      try {
        const res = await authService.faceVerify(voterId.trim(), imageSrc)
        if (res.data.success && res.data.data.is_match) {
          setVerificationStatus('success')
        } else {
          setVerificationStatus('failed')
          addToast('Face biometric verification failed. Please align your face.', 'error')
        }
      } catch (err) {
        setVerificationStatus('failed')
        addToast(err.response?.data?.message || 'Face verification service error.', 'error')
      }
    }
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setVerificationStatus(null)
  }

  const handleVoterLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!voterId.trim()) { setError('Voter ID is required.'); return }
    if (!capturedImage) { setError('Biometric face photo is required for authentication.'); return }

    setLoading(true)
    try {
      const res = await authService.voterLogin(voterId.trim(), capturedImage)
      if (res.data.success) {
        login(res.data.data.access_token, res.data.data.user, res.data.data.voter)
        addToast('Biometric authentication confirmed! Welcome back.', 'success')
        navigate('/voter/dashboard')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please verify your credentials and face match.'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim()) { setError('Username is required.'); return }
    if (!password) { setError('Password is required.'); return }

    setLoading(true)
    try {
      const res = await authService.adminLogin(username.trim(), password, capturedImage)
      if (res.data.success) {
        login(res.data.data.access_token, res.data.data.user)
        addToast('Admin credentials verified. Welcome to Console.', 'success')
        navigate('/admin/dashboard')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Admin authentication failed.'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-logo">
            <Shield size={42} />
          </div>
          <h1>SecureVote</h1>
          <p>
            India's premier AI & Biometrics powered electronic voting portal. Ensuring tamper-proof, transparent democratic elections with real-time face verification.
          </p>

          <div className="login-features-list">
            <div className="login-feature-item">
              <ShieldCheck size={20} style={{ color: '#00f0ff', flexShrink: 0 }} />
              <span>Real-Time Biometric Face Matching & Liveness Check</span>
            </div>
            <div className="login-feature-item">
              <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>Strict One-Voter, One-Vote Cryptographic Ledger</span>
            </div>
            <div className="login-feature-item">
              <Vote size={20} style={{ color: '#8b5cf6', flexShrink: 0 }} />
              <span>Live Election Analytics & Transparent Public Auditing</span>
            </div>
          </div>

          <div className="login-security-badge">
            <Lock size={16} />
            End-to-End Cryptographic Security Guarantee
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Secure Identity Portal</h2>
          <p className="login-subtitle" style={{ marginBottom: 20 }}>
            {loginType === 'voter' ? 'Voter Biometric Authentication' : 'Administrator Control Access'}
          </p>

          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab ${loginType === 'voter' ? 'active' : ''}`}
              onClick={() => { setLoginType('voter'); setError(''); setCapturedImage(null); setVerificationStatus(null) }}
            >
              <Fingerprint size={16} />
              Voter Biometrics
            </button>
            <button
              type="button"
              className={`login-tab ${loginType === 'admin' ? 'active' : ''}`}
              onClick={() => { setLoginType('admin'); setError(''); setCapturedImage(null); setVerificationStatus(null) }}
            >
              <Lock size={16} />
              Administrator
            </button>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {loginType === 'voter' ? (
            <form onSubmit={handleVoterLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="voter-id">Voter ID Number</label>
                <input
                  id="voter-id"
                  className="form-input"
                  type="text"
                  placeholder="Enter your Voter ID (e.g., VOT001)"
                  value={voterId}
                  onChange={e => setVoterId(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Live Biometric Verification</label>
                <WebcamCapture
                  onCapture={handleCapture}
                  capturedImage={capturedImage}
                  onRetake={handleRetake}
                  verificationStatus={verificationStatus}
                />
              </div>

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={loading || verificationStatus === 'verifying'}
              >
                {loading ? 'Validating Biometrics...' : 'Authenticate & Enter Voting Portal'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="admin-username">Admin Username</label>
                <input
                  id="admin-username"
                  className="form-input"
                  type="text"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="admin-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="admin-password"
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter admin password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Biometric Verification (Optional)</label>
                <WebcamCapture
                  onCapture={setCapturedImage}
                  capturedImage={capturedImage}
                  onRetake={() => setCapturedImage(null)}
                />
              </div>

              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Authenticating Admin...' : 'Login to Admin Console'}
              </button>
            </form>
          )}

          {/* Quick Demo Credentials Switcher */}
          <div className="demo-accounts-box">
            <p>⚡ Quick Demo Credentials:</p>
            <div className="demo-accounts-btns">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setLoginType('admin')
                  setUsername('admin')
                  setPassword('admin123')
                }}
              >
                <KeyRound size={13} /> Admin Demo
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setLoginType('voter')
                  setVoterId('VOT001')
                }}
              >
                <Fingerprint size={13} /> Voter Demo (VOT001)
              </button>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 22, fontSize: '0.88rem' }}>
            New voter? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Enroll for Biometric Voting</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
