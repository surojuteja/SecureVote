import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Calendar, ShieldCheck, CreditCard, Edit2, Save, X } from 'lucide-react'
import VoterLayout from '../../layouts/VoterLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import voteService from '../../services/voteService'

export default function Profile() {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  const fetchProfile = async () => {
    try {
      const res = await voteService.getVoterProfile()
      if (res.data.success) setProfile(res.data.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleEdit = () => {
    setFormData({
      full_name: v.full_name || '',
      phone: v.phone || '',
      date_of_birth: v.date_of_birth ? v.date_of_birth.split('T')[0] : '',
      address: v.address || ''
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await voteService.updateVoterProfile(formData)
      if (res.data.success) {
        addToast('Profile updated successfully', 'success')
        setProfile(prev => ({ ...prev, voter: res.data.data.voter }))
        setIsEditing(false)
      }
    } catch (err) {
      addToast('Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <VoterLayout><LoadingSpinner /></VoterLayout>

  const u = profile?.user || {}
  const v = profile?.voter || {}

  return (
    <VoterLayout title="My Profile">
      <div className="page-header">
        <div className="page-title">
          <h1>My Profile</h1>
          <p>Your voter registration details</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="card-body">
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '2.5rem', color: 'white', fontWeight: 800
            }}>
              {v.full_name?.charAt(0) || 'V'}
            </div>
            <h3 style={{ marginBottom: 4 }}>{v.full_name}</h3>
            <p className="text-muted text-sm" style={{ marginBottom: 12 }}>Voter ID: {v.voter_id}</p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              <span className={`badge ${v.is_verified ? 'badge-verified' : 'badge-unverified'}`}>
                {v.is_verified ? '✓ Verified' : 'Unverified'}
              </span>
              <span className={`badge ${v.is_eligible ? 'badge-eligible' : 'badge-ineligible'}`}>
                {v.is_eligible ? 'Eligible' : 'Ineligible'}
              </span>
            </div>

            {v.has_face_registered && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--success)', fontSize: '0.85rem' }}>
                <ShieldCheck size={16} /> Face Authentication Enabled
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Personal Information</h3>
            {!isEditing ? (
              <button className="btn btn-outline btn-sm" onClick={handleEdit}>
                <Edit2 size={14} /> Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)} disabled={saving}>
                  <X size={14} /> Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
          <div className="card-body">
            {!isEditing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <CreditCard size={14} /> Voter ID
                  </div>
                  <p style={{ fontWeight: 600 }}>{v.voter_id}</p>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <User size={14} /> Username
                  </div>
                  <p style={{ fontWeight: 600 }}>{u.username}</p>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Mail size={14} /> Email
                  </div>
                  <p style={{ fontWeight: 600 }}>{u.email}</p>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Phone size={14} /> Phone
                  </div>
                  <p style={{ fontWeight: 600 }}>{v.phone || '—'}</p>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Calendar size={14} /> Date of Birth
                  </div>
                  <p style={{ fontWeight: 600 }}>{v.date_of_birth ? new Date(v.date_of_birth).toLocaleDateString() : '—'}</p>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Calendar size={14} /> Registered On
                  </div>
                  <p style={{ fontWeight: 600 }}>{v.created_at ? new Date(v.created_at).toLocaleDateString() : '—'}</p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <MapPin size={14} /> Address
                  </div>
                  <p style={{ fontWeight: 600 }}>{v.address || '—'}</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone</label>
                  <input
                    className="form-input"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Date of Birth</label>
                  <input
                    className="form-input"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </VoterLayout>
  )
}
