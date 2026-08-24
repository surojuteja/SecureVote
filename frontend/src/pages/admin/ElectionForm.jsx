import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useToast } from '../../components/Toast'
import electionService from '../../services/electionService'

export default function ElectionForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', start_datetime: '', end_datetime: '',
  })

  useEffect(() => {
    if (isEdit) {
      const fetch = async () => {
        try {
          const res = await electionService.getElection(id)
          if (res.data.success) {
            const e = res.data.data.election
            setForm({
              title: e.title || '',
              description: e.description || '',
              start_datetime: e.start_datetime ? e.start_datetime.slice(0, 16) : '',
              end_datetime: e.end_datetime ? e.end_datetime.slice(0, 16) : '',
            })
          }
        } catch (err) {
          addToast('Failed to load election', 'error')
          navigate('/admin/elections')
        } finally {
          setLoading(false)
        }
      }
      fetch()
    }
  }, [id])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { addToast('Title is required', 'error'); return }
    if (!form.start_datetime || !form.end_datetime) { addToast('Start and end dates are required', 'error'); return }
    if (new Date(form.end_datetime) <= new Date(form.start_datetime)) {
      addToast('End date must be after start date', 'error'); return
    }

    setSaving(true)
    try {
      if (isEdit) {
        await electionService.updateElection(id, form)
        addToast('Election updated successfully', 'success')
      } else {
        await electionService.createElection(form)
        addToast('Election created successfully', 'success')
      }
      navigate('/admin/elections')
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save election', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLayout><LoadingSpinner /></AdminLayout>

  return (
    <AdminLayout title={isEdit ? 'Edit Election' : 'Create Election'}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/admin/elections')}>
            <ArrowLeft size={20} />
          </button>
          <div className="page-title">
            <h1>{isEdit ? 'Edit Election' : 'Create New Election'}</h1>
            <p>{isEdit ? 'Update election details' : 'Schedule a new election event'}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        <div className="card-header"><h3>Election Details</h3></div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="ef-title">Election Title *</label>
              <input id="ef-title" className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="e.g., Student Council President Election 2026" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ef-desc">Description</label>
              <textarea id="ef-desc" className="form-input" name="description" value={form.description} onChange={handleChange} placeholder="Provide a description of this election..." rows={4} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="ef-start">Start Date & Time *</label>
                <input id="ef-start" className="form-input" name="start_datetime" type="datetime-local" value={form.start_datetime} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ef-end">End Date & Time *</label>
                <input id="ef-end" className="form-input" name="end_datetime" type="datetime-local" value={form.end_datetime} onChange={handleChange} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/elections')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} /> {saving ? 'Saving...' : isEdit ? 'Update Election' : 'Create Election'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}
