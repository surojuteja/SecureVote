import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Trophy, TrendingUp, Users, Award, ShieldCheck, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import VoterLayout from '../../layouts/VoterLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import electionService from '../../services/electionService'
import voteService from '../../services/voteService'

const COLORS = ['#00f0ff', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#ec4899']

export default function Results() {
  const [elections, setElections] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [results, setResults] = useState(null)
  const [voterStatus, setVoterStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingResults, setLoadingResults] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await electionService.getElections()
        if (res.data.success) {
          const completed = res.data.data.elections.filter(e => e.status === 'COMPLETED')
          setElections(completed)
          if (completed.length > 0) setSelectedId(completed[0].id)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  useEffect(() => {
    if (!selectedId) return
    const fetch = async () => {
      setLoadingResults(true)
      try {
        const [res, statusRes] = await Promise.all([
          electionService.getResults(selectedId),
          voteService.getVotingStatus(selectedId).catch(() => ({ data: { success: false } })),
        ])
        if (res.data.success) setResults(res.data.data)
        if (statusRes.data?.success) setVoterStatus(statusRes.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingResults(false)
      }
    }
    fetch()
  }, [selectedId])

  if (loading) return <VoterLayout title="Certified Election Outcomes"><LoadingSpinner /></VoterLayout>

  return (
    <VoterLayout title="Election Outcomes & Public Audit">
      <div className="page-header">
        <div className="page-title">
          <h1>Official Election Results</h1>
          <p>Certified results made available for every voter after polling conclusion</p>
        </div>
        {elections.length > 0 && (
          <select
            className="form-input"
            style={{ width: 320 }}
            value={selectedId || ''}
            onChange={e => setSelectedId(Number(e.target.value))}
          >
            {elections.map(el => <option key={el.id} value={el.id}>{el.title}</option>)}
          </select>
        )}
      </div>

      {elections.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No completed elections yet"
          message="When voting time finishes, certified outcomes and results will be published here for every voter."
        />
      ) : loadingResults ? (
        <LoadingSpinner />
      ) : results ? (
        <div>
          {/* Winner Banner */}
          {results.winner && (
            <div className="result-winner">
              <Award size={48} style={{ margin: '0 auto 10px', color: '#fbbf24' }} />
              <h3>🏆 Certified Winner: {results.winner.name}</h3>
              <p style={{ color: '#fef08a', fontSize: '1rem', marginTop: 4 }}>
                {results.winner.party ? `Party: ${results.winner.party} — ` : ''}
                <strong>{results.winner.votes} votes</strong> ({results.winner.percentage}%)
              </p>
            </div>
          )}

          {results.is_tie && (
            <div className="result-winner" style={{ borderColor: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)' }}>
              <h3 style={{ color: '#fbbf24' }}>⚖️ Certified Result: Tie</h3>
              <p style={{ color: '#fde68a' }}>Multiple candidates received the equal highest number of votes.</p>
            </div>
          )}

          {/* Individual Voter Participation Card */}
          <div className="card" style={{ border: '1px solid rgba(0, 240, 255, 0.25)', marginBottom: 24, background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.06), transparent)' }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ShieldCheck size={26} style={{ color: 'var(--primary)' }} />
                <div>
                  <h4 style={{ color: '#ffffff', marginBottom: 2 }}>Your Ballot Participation Record</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {voterStatus?.has_voted
                      ? `You cast a verified ballot on ${new Date(voterStatus.voted_at).toLocaleString()}`
                      : 'You did not cast a ballot in this election cycle.'}
                  </p>
                </div>
              </div>

              {voterStatus?.has_voted ? (
                <span className="badge badge-verified">
                  <CheckCircle2 size={13} /> Vote Recorded & Counted
                </span>
              ) : (
                <span className="badge badge-unverified">
                  <AlertCircle size={13} /> Did Not Vote
                </span>
              )}
            </div>
          </div>

          {/* Turnout Stats */}
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon blue"><Users size={24} /></div>
              <div className="stat-info">
                <h4>Eligible Voters</h4>
                <div className="stat-value">{results.total_eligible_voters}</div>
              </div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon green"><Trophy size={24} /></div>
              <div className="stat-info">
                <h4>Total Votes Counted</h4>
                <div className="stat-value">{results.total_votes}</div>
              </div>
            </div>
            <div className="stat-card purple">
              <div className="stat-icon purple"><TrendingUp size={24} /></div>
              <div className="stat-info">
                <h4>Voter Turnout</h4>
                <div className="stat-value">{results.participation_percentage}%</div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="card">
              <div className="card-header"><h3>Candidate Vote Tally</h3></div>
              <div className="card-body" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.results}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0e1424', borderColor: 'rgba(0,240,255,0.3)', borderRadius: 8, color: '#ffffff' }} />
                    <Bar dataKey="votes" radius={[8, 8, 0, 0]}>
                      {results.results.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>Vote Share Distribution</h3></div>
              <div className="card-body" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={results.results}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={100}
                      dataKey="votes"
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                    >
                      {results.results.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0e1424', borderColor: 'rgba(0,240,255,0.3)', borderRadius: 8, color: '#ffffff' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Candidate Leaderboard Breakdown */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><h3>Detailed Candidate Breakdown</h3></div>
            <div className="card-body">
              {results.results.map((c, i) => (
                <div className="result-bar-wrapper" key={c.candidate_id || i}>
                  <div className="result-bar-header">
                    <span>
                      <strong style={{ color: '#ffffff' }}>{c.name}</strong> {c.party && <span style={{ color: 'var(--primary)', marginLeft: 6 }}>({c.party})</span>}
                    </span>
                    <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
                      {c.votes} votes ({c.percentage}%)
                    </span>
                  </div>
                  <div className="result-bar-track">
                    <div
                      className="result-bar-fill"
                      style={{ width: `${c.percentage}%`, background: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </VoterLayout>
  )
}
