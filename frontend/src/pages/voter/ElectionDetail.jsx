import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Vote, CalendarDays, Clock, Users, CheckCircle, UserPlus, Loader2, XCircle, AlertCircle } from 'lucide-react'
import VoterLayout from '../../layouts/VoterLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useToast } from '../../components/Toast'
import voteService from '../../services/voteService'
import electionService from '../../services/electionService'

export default function ElectionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [election, setElection] = useState(null)
  const [votingStatus, setVotingStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  // Candidate application state
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [applyForm, setApplyForm] = useState({ party: '', description: '' })
  const [applying, setApplying] = useState(false)
  const [myApplication, setMyApplication] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [elRes, statusRes, appsRes] = await Promise.all([
          voteService.getVoterElection(id),
          voteService.getVotingStatus(id),
          electionService.getApplications(id),
        ])
        if (elRes.data.success) setElection(elRes.data.data.election)
        if (statusRes.data.success) setVotingStatus(statusRes.data.data)
        if (appsRes.data.success && appsRes.data.data.applications?.length > 0) {
          setMyApplication(appsRes.data.data.applications[0])
        }
      } catch (err) {
        addToast('Failed to load election', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleApply = async (e) => {
    e.preventDefault()
    setApplying(true)
    try {
      const res = await electionService.applyAsCandidate(id, applyForm)
      if (res.data.success) {
        addToast('Application submitted! Awaiting admin approval.', 'success')
        setMyApplication(res.data.data.application)
        setShowApplyForm(false)
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit application', 'error')
    } finally {
      setApplying(false)
    }
  }

  const formatDate = (iso) => iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) : '-'

  const statusBadge = (s) => {
    const cls = { UPCOMING: 'badge-upcoming', ACTIVE: 'badge-active', COMPLETED: 'badge-completed' }
    return <span className={`badge ${cls[s] || ''}`}>{s}</span>
  }

  const applicationStatusIcon = () => {
    if (!myApplication) return null
    const s = myApplication.status
    if (s === 'PENDING') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--warning)', fontWeight: 600, fontSize: '0.9rem' }}>
        <Loader2 size={18} className="spin" /> Application Pending
      </div>
    )
    if (s === 'APPROVED') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>
        <CheckCircle size={18} /> Application Approved
      </div>
    )
    if (s === 'REJECTED') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontWeight: 600, fontSize: '0.9rem' }}>
        <XCircle size={18} /> Application Rejected
      </div>
    )
    return null
  }

  if (loading) return <VoterLayout><LoadingSpinner /></VoterLayout>
  if (!election) return <VoterLayout><p>Election not found</p></VoterLayout>

  return (
    <VoterLayout title={election.title}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/voter/elections')}><ArrowLeft size={20} /></button>
          <div className="page-title">
            <h1>{election.title}</h1>
            <p>{election.description || 'Election details'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {statusBadge(election.status)}
          {election.status === 'ACTIVE' && !votingStatus?.has_voted && (
            <button className="btn btn-success" onClick={() => navigate(`/voter/elections/${id}/vote`)}>
              <Vote size={18} /> Cast Your Vote
            </button>
          )}
          {votingStatus?.has_voted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontWeight: 600 }}>
              <CheckCircle size={18} /> You have voted
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <CalendarDays size={24} style={{ color: 'var(--primary)', marginBottom: 8 }} />
            <p className="text-sm text-secondary">Starts</p>
            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatDate(election.start_datetime)}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <Clock size={24} style={{ color: 'var(--danger)', marginBottom: 8 }} />
            <p className="text-sm text-secondary">Ends</p>
            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatDate(election.end_datetime)}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center' }}>
            <Users size={24} style={{ color: 'var(--secondary)', marginBottom: 8 }} />
            <p className="text-sm text-secondary">Candidates</p>
            <p style={{ fontWeight: 700, fontSize: '1.5rem' }}>{election.total_candidates}</p>
          </div>
        </div>
      </div>

      {/* Candidate Application Section */}
      {election.status === 'UPCOMING' && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3><UserPlus size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Register as Candidate</h3>
            {applicationStatusIcon()}
          </div>
          <div className="card-body">
            {myApplication ? (
              <div style={{ padding: '16px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <p className="text-sm text-secondary" style={{ marginBottom: 4 }}>Party</p>
                    <p style={{ fontWeight: 500 }}>{myApplication.party || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary" style={{ marginBottom: 4 }}>Status</p>
                    <span className={`badge ${myApplication.status === 'APPROVED' ? 'badge-active' : myApplication.status === 'REJECTED' ? 'badge-cancelled' : 'badge-upcoming'}`}>
                      {myApplication.status}
                    </span>
                  </div>
                </div>
                {myApplication.description && (
                  <div style={{ marginTop: 16 }}>
                    <p className="text-sm text-secondary" style={{ marginBottom: 4 }}>Description</p>
                    <p>{myApplication.description}</p>
                  </div>
                )}
                {myApplication.status === 'REJECTED' && (
                  <div className="alert alert-error" style={{ marginTop: 16 }}>
                    <AlertCircle size={16} />
                    Your candidacy application was rejected by the admin.
                  </div>
                )}
              </div>
            ) : showApplyForm ? (
              <form onSubmit={handleApply}>
                <div className="form-row" style={{ marginBottom: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Party Name</label>
                    <input className="form-input" value={applyForm.party} onChange={e => setApplyForm(p => ({ ...p, party: e.target.value }))} placeholder="Your party name (optional)" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Brief Description</label>
                    <input className="form-input" value={applyForm.description} onChange={e => setApplyForm(p => ({ ...p, description: e.target.value }))} placeholder="Why you should be elected" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowApplyForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={applying}>
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p className="text-secondary" style={{ marginBottom: 16 }}>
                  Want to stand as a candidate in this election? Apply now and the admin will review your application.
                </p>
                <button className="btn btn-primary" onClick={() => setShowApplyForm(true)}>
                  <UserPlus size={18} /> Apply as Candidate
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h3>Candidates</h3></div>
        <div className="card-body">
          {election.candidates?.length > 0 ? (
            <div className="candidate-grid">
              {election.candidates.map(c => (
                <div className="candidate-card" key={c.id} style={{ cursor: 'default' }}>
                  <div className="candidate-avatar">{c.name?.charAt(0)}</div>
                  <div className="candidate-name">{c.name}</div>
                  {c.party && <div className="candidate-party">{c.party}</div>}
                  {c.description && <div className="candidate-desc">{c.description}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted" style={{ textAlign: 'center', padding: 24 }}>No candidates listed yet</p>
          )}
        </div>
      </div>
    </VoterLayout>
  )
}
