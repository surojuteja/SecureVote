import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, AlertTriangle, ShieldCheck, Vote, Sparkles, Hash, Calendar, Clock, UserCheck } from 'lucide-react'
import VoterLayout from '../../layouts/VoterLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import ConfirmModal from '../../components/ConfirmModal'
import { useToast } from '../../components/Toast'
import voteService from '../../services/voteService'

export default function VotingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [election, setElection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [voteResult, setVoteResult] = useState(null)
  const [alreadyVoted, setAlreadyVoted] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [elRes, statusRes] = await Promise.all([
          voteService.getVoterElection(id),
          voteService.getVotingStatus(id),
        ])
        if (elRes.data.success) setElection(elRes.data.data.election)
        if (statusRes.data.success && statusRes.data.data.has_voted) {
          setAlreadyVoted(true)
        }
      } catch (err) {
        addToast('Failed to load election details', 'error')
        navigate('/voter/elections')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  const handleVote = async () => {
    setShowConfirm(false)
    setSubmitting(true)
    try {
      const res = await voteService.castVote(Number(id), selectedCandidate)
      if (res.data.success) {
        setVoteResult(res.data.data)
        addToast('Your vote has been cryptographically recorded!', 'success')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit vote'
      addToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <VoterLayout><LoadingSpinner /></VoterLayout>
  if (!election) return <VoterLayout><p>Election not found</p></VoterLayout>

  // Already voted state
  if (alreadyVoted && !voteResult) {
    return (
      <VoterLayout title="Ballot Already Submitted">
        <div className="card" style={{ maxWidth: 640, margin: '40px auto', textAlign: 'center' }}>
          <div className="card-body" style={{ padding: '48px 36px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <AlertTriangle size={36} />
            </div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: 12 }}>Ballot Already Cast</h2>
            <p className="text-secondary" style={{ marginBottom: 24, fontSize: '0.95rem', lineHeight: 1.6 }}>
              You have already exercised your vote in <strong>{election.title}</strong>. Under the one-voter-one-vote protocol, cast ballots are immutable and cannot be modified.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/voter/dashboard')}>
              Return to Voter Dashboard
            </button>
          </div>
        </div>
      </VoterLayout>
    )
  }

  // Vote success state with cryptographic receipt
  if (voteResult) {
    return (
      <VoterLayout title="Vote Confirmed">
        <div className="card" style={{ maxWidth: 680, margin: '30px auto' }}>
          <div className="card-body" style={{ padding: '40px 36px', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              color: 'var(--success)', border: '2px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 0 30px var(--success-glow)'
            }}>
              <CheckCircle size={44} />
            </div>

            <h2 style={{ fontSize: '1.7rem', marginBottom: 8 }}>Vote Successfully Recorded!</h2>
            <p className="text-secondary" style={{ marginBottom: 28, fontSize: '0.92rem' }}>
              Your electronic ballot has been cryptographically signed and stored in the secure voting ledger.
            </p>

            {/* Cryptographic Digital Receipt Card */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)', padding: '24px', textAlign: 'left', marginBottom: 28
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, marginBottom: 16 }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', fontWeight: 700 }}>
                  <ShieldCheck size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  Digital Voting Receipt
                </span>
                <span className="badge badge-verified">Verified</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Election</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{voteResult.election_title}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Timestamp</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{new Date(voteResult.voted_at).toLocaleString()}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Cryptographic Reference ID</div>
                  <div style={{
                    fontFamily: 'monospace', background: 'rgba(0, 240, 255, 0.08)',
                    padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0, 240, 255, 0.2)',
                    fontSize: '0.88rem', color: 'var(--primary)', wordBreak: 'break-all'
                  }}>
                    {voteResult.reference_id}
                  </div>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Save this Reference ID to verify your participation in election outcome auditing.
            </p>

            <button className="btn btn-primary" onClick={() => navigate('/voter/dashboard')}>
              Return to Voter Dashboard
            </button>
          </div>
        </div>
      </VoterLayout>
    )
  }

  // Election not active
  if (election.status !== 'ACTIVE') {
    return (
      <VoterLayout title="Voting Unavailable">
        <div className="card" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
          <div className="card-body" style={{ padding: 40 }}>
            <AlertTriangle size={48} style={{ color: 'var(--warning)', margin: '0 auto 16px' }} />
            <h2>Voting Window Closed</h2>
            <p className="text-secondary" style={{ marginTop: 8, marginBottom: 20 }}>
              This election is currently {election.status.toLowerCase()}. Ballots can only be submitted during active voting hours.
            </p>
            <button className="btn btn-outline" onClick={() => navigate('/voter/elections')}>
              Back to Elections List
            </button>
          </div>
        </div>
      </VoterLayout>
    )
  }

  const selectedCandidateData = election.candidates?.find(c => c.id === selectedCandidate)

  return (
    <VoterLayout title="Electronic Voting Booth">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(`/voter/elections/${id}`)}>
            <ArrowLeft size={20} />
          </button>
          <div className="page-title">
            <h1>Cast Your Vote</h1>
            <p>{election.title}</p>
          </div>
        </div>
      </div>

      {/* Timing Alert Banner */}
      <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(0, 240, 255, 0.25)', background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.08), transparent)' }}>
        <div className="card-body" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={20} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>
              <strong>Active Voting Period:</strong> Closes on {new Date(election.end_datetime).toLocaleString()}
            </span>
          </div>
          <span className="badge badge-active">Live Ballot</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Choose a Candidate</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Select your candidate below and click "Review & Submit Vote".
            </p>
          </div>
          {selectedCandidate && (
            <span className="badge badge-verified">Candidate Selected</span>
          )}
        </div>

        <div className="card-body">
          <div className="candidate-grid">
            {election.candidates?.map(c => (
              <div
                key={c.id}
                className={`candidate-card ${selectedCandidate === c.id ? 'selected' : ''}`}
                onClick={() => setSelectedCandidate(c.id)}
                role="radio"
                aria-checked={selectedCandidate === c.id}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setSelectedCandidate(c.id)}
              >
                <div className="candidate-avatar">{c.name?.charAt(0)}</div>
                <div className="candidate-name">{c.name}</div>
                {c.party && <div className="candidate-party">{c.party}</div>}
                {c.description && <div className="candidate-desc">{c.description}</div>}

                {selectedCandidate === c.id && (
                  <div style={{
                    marginTop: 14, display: 'flex', alignItems: 'center', gap: 6,
                    color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 700
                  }}>
                    <CheckCircle size={16} /> Selected Choice
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 36, gap: 12 }}>
            <button
              className="btn btn-success btn-lg"
              disabled={!selectedCandidate || submitting}
              onClick={() => setShowConfirm(true)}
              style={{ minWidth: 260 }}
            >
              <Vote size={20} />
              {submitting ? 'Submitting Ballot...' : 'Confirm & Submit Vote'}
            </button>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              🔒 Votes are anonymous, tamper-proof, and irreversible once confirmed.
            </p>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Confirm Electronic Ballot Submission"
          message={`You are casting your vote for "${selectedCandidateData?.name || 'Selected Candidate'}". Once submitted, your vote cannot be changed or recalled. Are you sure?`}
          confirmText="Yes, Cast My Vote"
          cancelText="Go Back"
          onConfirm={handleVote}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </VoterLayout>
  )
}
