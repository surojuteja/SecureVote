import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Lock, Eye, EyeOff, UserPlus, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react'
import { useToast } from '../components/Toast'
import WebcamCapture from '../components/WebcamCapture'
import authService from '../services/authService'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    phone: '',
    date_of_birth: '',
    address: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!formData.username.trim() || !formData.email.trim() || !formData.full_name.trim() || !formData.password) {
      setError('Full Name, Username, Email, and Password are required.')
      return
    }
    if (!capturedImage) {
      setError('Biometric facial enrollment photo is mandatory.')
      return
    }

    setLoading(true)
    try {
      const res = await authService.register({
        ...formData,
        face_image: capturedImage
      })
      if (res.data.success) {
        addToast('Voter registration and facial enrollment submitted successfully!', 'success')
        navigate('/login')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please check your data and try again.'
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
          <h1>Voter Enrollment</h1>
          <p>
            Create your citizen voting profile with state-of-the-art facial biometric registration. Ensure your democratic voice is safeguarded with multi-layered cryptographic verification.
          </p>

          <div className="login-security-badge">
            <Lock size={16} />
            Encrypted Biometric Template Storage
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card" style={{ maxHeight: '92vh', overflowY: 'auto' }}>
          <h2>Citizen Registration</h2>
          <p className="login-subtitle" style={{ marginBottom: 24 }}>
            Enroll your profile & biometric face ID
          </p>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label" htmlFor="full_name">Legal Full Name</label>
              <input
                id="full_name"
                name="full_name"
                className="form-input"
                type="text"
                placeholder="e.g., Rajesh Sharma"
                value={formData.full_name}
                onChange={handleInputChange}
                autoComplete="off"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  className="form-input"
                  type="text"
                  placeholder="Choose unique username"
                  value={formData.username}
                  onChange={handleInputChange}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  className="form-input"
                  type="email"
                  placeholder="voter@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  className="form-input"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={handleInputChange}
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="date_of_birth">Date of Birth</label>
                <input
                  id="date_of_birth"
                  name="date_of_birth"
                  className="form-input"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="address">Residential Address</label>
              <textarea
                id="address"
                name="address"
                className="form-input"
                placeholder="Enter complete residential address"
                value={formData.address}
                onChange={handleInputChange}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Security Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  name="password"
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create secure password"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={{ paddingRight: 44 }}
                  required
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
              <label className="form-label">Facial Biometric Enrollment</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Please sit in good lighting, look straight into the camera, and snap your enrollment photo.
              </p>
              <WebcamCapture
                onCapture={setCapturedImage}
                capturedImage={capturedImage}
                onRetake={() => setCapturedImage(null)}
              />
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 14 }} disabled={loading}>
              <UserPlus size={18} />
              {loading ? 'Submitting Enrollment...' : 'Complete Voter Registration'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 22, fontSize: '0.88rem' }}>
            Already registered? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in with Biometrics</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
