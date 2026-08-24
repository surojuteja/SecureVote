import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit, Trash2, Trophy, Users, CalendarDays, UserCheck, UserX, Clock } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import ConfirmModal from '../../components/ConfirmModal'
import { useToast } from '../../components/Toast'
import electionService from '../../services/electionService'

export default function ElectionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [election, setElection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddCandidate, setShowAddCandidate] = useState(false)
  const [candidateForm, setCandidateForm] = useState({ name: '', party: '', description: '' })
  const [savingCandidate, setSavingCandidate] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState(null)
  const [editCandidate, setEditCandidate] = useState(null)

  // Applications state
  const [applications, setApplications] = useState([])
  const [reviewingApp, setReviewingApp] = useState(null)

  const fetchElection = async () => {
    try {
      const res = await electionService.getElection(id)
      if (res.data.success) setElection(res.data.data.election)
    } catch (err) {
      addToast('Failed to load election', 'error')
      navigate('/admin/elections')
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      const res = await electionService.getApplications(id)
      if (res.data.success) setApplications(res.data.data.applications || [])
    } catch (err) {
      // silently fail
    }
  }

  useEffect(() => {
    fetchElection()
    fetchApplications()
  }, [id])

  const handleAddCandidate = async (e) => {
    e.preventDefault()
    if (!candidateForm.name.trim()) { addToast('Candidate name is required', 'error'); return }
    setSavingCandidate(true)
    try {
      if (editCandidate) {
        await electionService.updateCandidate(editCandidate.id, candidateForm)
        addToast('Candidate updated', 'success')
      } else {
        await electionService.addCandidate(id, candidateForm)
        addToast('Candidate added', 'success')
      }
      setCandidateForm({ name: '', party: '', description: '' })
      setShowAddCandidate(false)
      setEditCandidate(null)
      fetchElection()
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save candidate', 'error')
    } finally {
      setSavingCandidate(false)
    }
  }

  const handleDeleteCandidate = async () => {
    try {
      await electionService.deleteCandidate(deleteCandidate)
      addToast('Candidate deleted', 'success')
      setDeleteCandidate(null)
      fetchElection()
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete candidate', 'error')
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await electionService.updateElection(id, { status: newStatus })
      addToast(`Election ${newStatus.toLowerCase()}`, 'success')
      fetchElection()
    } catch (err) {
      addToast('Failed to update status', 'error')
    }
  }

  const handleReviewApplication = async (appId, status) => {
    setReviewingApp(appId)
    try {
      await electionService.reviewApplication(id, appId, { status })
      addToast(`Application ${status.toLowerCase()}`, 'success')
      fetchApplications()
      fetchElection()
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to review application', 'error')
    } finally {
      setReviewingApp(null)
    }
  }

  const formatDate = (iso) => iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '-'

  const statusBadge = (s) => {
    const cls = { UPCOMING: 'badge-upcoming', ACTIVE: 'badge-active', COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled' }
    return <span className={`badge ${cls[s] || ''}`}>{s}</span>
  }

  if (loading) return <AdminLayout><LoadingSpinner /></AdminLayout>
  if (!election) return <AdminLayout><p>Election not found</p></AdminLayout>

  const pendingApps = applications.filter(a => a.status === 'PENDING')
  const reviewedApps = applications.filter(a => a.status !== 'PENDING')

  return (
    <AdminLayout title="Election Details">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/admin/elections')}><ArrowLeft size={20} /></button>
          <div className="page-title">
            <h1>{election.title}</h1>
            <p>{election.description || 'No description'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {election.status === 'UPCOMING' && (
            <button className="btn btn-outline btn-sm" onClick={() => handleStatusChange('CANCELLED')}>Cancel Election</button>
          )}
          {election.status === 'ACTIVE' && (
            <button className="btn btn-outline btn-sm" onClick={() => handleStatusChange('COMPLETED')}>End Election</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/admin/elections/${id}/edit`)}><Edit size={16} /> Edit</button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card blue">
          <div className="stat-icon blue"><CalendarDays size={24} /></div>
          <div className="stat-info">
            <h4>Status</h4>
            <div style={{ marginTop: 4 }}>{statusBadge(election.status)}</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><Users size={24} /></div>
          <div className="stat-info">
            <h4>Candidates</h4>
            <div className="stat-value">{election.total_candidates}</div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><Trophy size={24} /></div>
          <div className="stat-info">
            <h4>Votes Cast</h4>
            <div className="stat-value">{election.total_votes}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-secondary" style={{ marginBottom: 4 }}>Start Date</p>
            <p style={{ fontWeight: 600 }}>{formatDate(election.start_datetime)}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-secondary" style={{ marginBottom: 4 }}>End Date</p>
            <p style={{ fontWeight: 600 }}>{formatDate(election.end_datetime)}</p>
          </div>
        </div>
      </div>

      {/* Candidate Applications Section */}
      {applications.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3>Candidate Applications ({applications.length})</h3>
            {pendingApps.length > 0 && (
              <span className="badge badge-upcoming">{pendingApps.length} Pending</span>
            )}
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Party</th>
                    <th>Description</th>
                    <th>Applied On</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 600 }}>{app.applicant_name}</td>
                      <td>{app.party || '—'}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.description || '—'}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(app.created_at)}</td>
                      <td>
                        <span className={`badge ${app.status === 'APPROVED' ? 'badge-active' : app.status === 'REJECTED' ? 'badge-cancelled' : 'badge-upcoming'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        {app.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleReviewApplication(app.id, 'APPROVED')}
                              disabled={reviewingApp === app.id}
                              title="Approve"
                            >
                              <UserCheck size={14} /> Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleReviewApplication(app.id, 'REJECTED')}
                              disabled={reviewingApp === app.id}
                              title="Reject"
                            >
                              <UserX size={14} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted text-sm">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Candidates ({election.candidates?.length || 0})</h3>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowAddCandidate(true); setEditCandidate(null); setCandidateForm({ name: '', party: '', description: '' }) }}>
            <Plus size={16} /> Add Candidate
          </button>
        </div>
        <div className="card-body">
          {showAddCandidate && (
            <form onSubmit={handleAddCandidate} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={candidateForm.name} onChange={e => setCandidateForm(p => ({ ...p, name: e.target.value }))} placeholder="Candidate name" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Party</label>
                  <input className="form-input" value={candidateForm.party} onChange={e => setCandidateForm(p => ({ ...p, party: e.target.value }))} placeholder="Party name" />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 12, marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <textarea className="form-input" value={candidateForm.description} onChange={e => setCandidateForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" rows={2} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => { setShowAddCandidate(false); setEditCandidate(null) }}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={savingCandidate}>
                  {savingCandidate ? 'Saving...' : editCandidate ? 'Update' : 'Add Candidate'}
                </button>
              </div>
            </form>
          )}

          {election.candidates?.length > 0 ? (
            <div className="candidate-grid">
              {election.candidates.map(c => (
                <div className="candidate-card" key={c.id} style={{ cursor: 'default' }}>
                  <div className="candidate-avatar">{c.name?.charAt(0)}</div>
                  <div className="candidate-name">{c.name}</div>
                  {c.party && <div className="candidate-party">{c.party}</div>}
                  {c.description && <div className="candidate-desc">{c.description}</div>}
                  <div style={{ marginTop: 12, display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditCandidate(c); setCandidateForm({ name: c.name, party: c.party || '', description: c.description || '' }); setShowAddCandidate(true) }}>
                      <Edit size={14} />
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleteCandidate(c.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted" style={{ textAlign: 'center', padding: 24 }}>No candidates added yet</p>
          )}
        </div>
      </div>

      {deleteCandidate && (
        <ConfirmModal title="Delete Candidate" message="Are you sure you want to remove this candidate?" confirmText="Delete" variant="danger" onConfirm={handleDeleteCandidate} onCancel={() => setDeleteCandidate(null)} />
      )}
    </AdminLayout>
  )
}
