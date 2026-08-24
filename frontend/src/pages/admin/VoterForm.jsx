import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Camera } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import WebcamCapture from '../../components/WebcamCapture'
import { useToast } from '../../components/Toast'
import adminService from '../../services/adminService'

export default function VoterForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedFace, setCapturedFace] = useState(null)
  const [enrolling, setEnrolling] = useState(false)
  const [form, setForm] = useState({
    voter_id: '', full_name: '', email: '', username: '', password: '',
    phone: '', address: '', date_of_birth: '', is_eligible: true,
  })
  const [voterData, setVoterData] = useState(null)

  useEffect(() => {
    if (isEdit) {
      const fetchVoter = async () => {
        try {
          const res = await adminService.getVoter(id)
          if (res.data.success) {
            const v = res.data.data.voter
            const u = res.data.data.user
            setForm({
              voter_id: v.voter_id || '', full_name: v.full_name || '',
              email: u?.email || '', username: u?.username || '', password: '',
              phone: v.phone || '', address: v.address || '',
              date_of_birth: v.date_of_birth || '', is_eligible: v.is_eligible,
            })
            setVoterData(v)
          }
        } catch (err) {
          addToast('Failed to load voter', 'error')
          navigate('/admin/voters')
        } finally {
          setLoading(false)
        }
      }
      fetchVoter()
    }
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit) {
        await adminService.updateVoter(id, form)
        addToast('Voter updated successfully', 'success')
      } else {
        const res = await adminService.createVoter(form)
        addToast('Voter created successfully', 'success')
        if (res.data.data?.voter?.id) {
          navigate(`/admin/voters/${res.data.data.voter.id}`)
          return
        }
      }
      navigate('/admin/voters')
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save voter', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleFaceEnroll = async () => {
    if (!capturedFace) return
    setEnrolling(true)
    try {
      const res = await adminService.enrollFace(id, capturedFace)
      if (res.data.success) {
        addToast('Face registered successfully!', 'success')
        setVoterData(res.data.data.voter)
        setShowCamera(false)
        setCapturedFace(null)
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Face enrollment failed', 'error')
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) return <AdminLayout><LoadingSpinner /></AdminLayout>

  return (
    <AdminLayout title={isEdit ? 'Edit Voter' : 'Add Voter'}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/admin/voters')}>
            <ArrowLeft size={20} />
          </button>
          <div className="page-title">
            <h1>{isEdit ? 'Edit Voter' : 'Register New Voter'}</h1>
            <p>{isEdit ? `Editing: ${form.full_name}` : 'Fill in voter details'}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isEdit ? '1fr 400px' : '1fr', gap: 24 }}>
        <div className="card">
          <div className="card-header"><h3>Voter Information</h3></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="vf-voter-id">Voter ID *</label>
                  <input id="vf-voter-id" className="form-input" name="voter_id" value={form.voter_id} onChange={handleChange} placeholder="e.g., VOT006" required disabled={isEdit} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="vf-full-name">Full Name *</label>
                  <input id="vf-full-name" className="form-input" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Full name" required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="vf-email">Email *</label>
                  <input id="vf-email" className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" required={!isEdit} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="vf-username">Username *</label>
                  <input id="vf-username" className="form-input" name="username" value={form.username} onChange={handleChange} placeholder="Username" required={!isEdit} disabled={isEdit} />
                </div>
                {!isEdit && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="vf-password">Password *</label>
                    <input id="vf-password" className="form-input" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="vf-phone">Phone</label>
                  <input id="vf-phone" className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="vf-dob">Date of Birth</label>
                  <input id="vf-dob" className="form-input" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 28 }}>
                  <input type="checkbox" id="vf-eligible" name="is_eligible" checked={form.is_eligible} onChange={handleChange} />
                  <label htmlFor="vf-eligible" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Eligible to Vote</label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="vf-address">Address</label>
                <textarea id="vf-address" className="form-input" name="address" value={form.address} onChange={handleChange} placeholder="Full address" />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/voters')}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={18} /> {saving ? 'Saving...' : 'Save Voter'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {isEdit && (
          <div className="card" style={{ alignSelf: 'start' }}>
            <div className="card-header">
              <h3>Face Enrollment</h3>
              <span className={`badge ${voterData?.is_verified ? 'badge-verified' : 'badge-unverified'}`}>
                {voterData?.is_verified ? 'Verified' : 'Not Registered'}
              </span>
            </div>
            <div className="card-body">
              {voterData?.has_face_registered && !showCamera ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--accent-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent-600)', fontSize: '2.5rem' }}>
                    ✓
                  </div>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>Face Registered</p>
                  <p className="text-muted text-sm" style={{ marginBottom: 16 }}>Voter can login using face verification</p>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowCamera(true)}>
                    <Camera size={16} /> Re-register Face
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>
                    Capture the voter's face to enable face-authenticated login.
                  </p>
                  <WebcamCapture
                    onCapture={setCapturedFace}
                    capturedImage={capturedFace}
                    onRetake={() => setCapturedFace(null)}
                  />
                  {capturedFace && (
                    <button
                      className="btn btn-success"
                      style={{ width: '100%', marginTop: 12 }}
                      onClick={handleFaceEnroll}
                      disabled={enrolling}
                    >
                      {enrolling ? 'Enrolling...' : 'Register Face'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
