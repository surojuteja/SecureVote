import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Trophy, TrendingUp, Users, Award } from 'lucide-react'
import AdminLayout from '../../layouts/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import electionService from '../../services/electionService'
import adminService from '../../services/adminService'

const COLORS = ['#3d56ed', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899']

export default function Results() {
  const [elections, setElections] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingResults, setLoadingResults] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await electionService.getElections()
        if (res.data.success) {
          const completed = res.data.data.elections.filter(e => e.status === 'COMPLETED')
          setElections(completed)
          if (completed.length > 0) {
            setSelectedId(completed[0].id)
          }
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  useEffect(() => {
    if (!selectedId) return
    const fetch = async () => {
      setLoadingResults(true)
      try {
        const res = await adminService.getAdminResults(selectedId)
        if (res.data.success) setResults(res.data.data)
      } catch (err) { console.error(err) }
      finally { setLoadingResults(false) }
    }
    fetch()
  }, [selectedId])

  if (loading) return <AdminLayout title="Results"><LoadingSpinner /></AdminLayout>

  return (
    <AdminLayout title="Election Results">
      <div className="page-header">
        <div className="page-title">
          <h1>Election Results</h1>
          <p>View detailed results of completed elections</p>
        </div>
        {elections.length > 0 && (
          <select className="form-input" style={{ width: 300 }} value={selectedId || ''} onChange={e => setSelectedId(Number(e.target.value))}>
            {elections.map(el => <option key={el.id} value={el.id}>{el.title}</option>)}
          </select>
        )}
      </div>

      {elections.length === 0 ? (
        <EmptyState icon={Trophy} title="No completed elections" message="Results will appear here after an election ends." />
      ) : loadingResults ? <LoadingSpinner /> : results ? (
        <div>
          {results.winner && (
            <div className="result-winner">
              <Award size={40} style={{ margin: '0 auto 8px', color: '#b45309' }} />
              <h3>🏆 Winner: {results.winner.name}</h3>
              <p style={{ color: '#92400e' }}>{results.winner.party || ''} — {results.winner.votes} votes ({results.winner.percentage}%)</p>
            </div>
          )}
          {results.is_tie && (
            <div className="result-winner" style={{ borderColor: 'var(--danger)', background: '#fef2f2' }}>
              <h3 style={{ color: 'var(--danger)' }}>⚖️ Result: Tie</h3>
              <p style={{ color: '#991b1b' }}>Multiple candidates share the highest number of votes.</p>
            </div>
          )}
          {results.result_status === 'No votes cast' && (
            <div className="result-winner" style={{ borderColor: 'var(--gray-400)', background: 'var(--gray-50)' }}>
              <h3 style={{ color: 'var(--text-secondary)' }}>No votes were cast in this election</h3>
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon blue"><Users size={24} /></div>
              <div className="stat-info"><h4>Total Eligible</h4><div className="stat-value">{results.total_eligible_voters}</div></div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon green"><Trophy size={24} /></div>
              <div className="stat-info"><h4>Total Votes</h4><div className="stat-value">{results.total_votes}</div></div>
            </div>
            <div className="stat-card purple">
              <div className="stat-icon purple"><TrendingUp size={24} /></div>
              <div className="stat-info"><h4>Participation</h4><div className="stat-value">{results.participation_percentage}%</div></div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="card">
              <div className="card-header"><h3>Votes by Candidate</h3></div>
              <div className="card-body" style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.results} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip formatter={(value, name) => [value, 'Votes']} />
                    <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
                      {results.results.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3>Vote Distribution</h3></div>
              <div className="card-body" style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={results.results} cx="50%" cy="50%" innerRadius={60} outerRadius={110} dataKey="votes" label={({ name, percentage }) => `${name} (${percentage}%)`}>
                      {results.results.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><h3>Detailed Results</h3></div>
            <div className="card-body">
              {results.results.map((c, i) => (
                <div className="result-bar-wrapper" key={c.id}>
                  <div className="result-bar-header">
                    <span><strong>{c.name}</strong> {c.party && `(${c.party})`}</span>
                    <span>{c.votes} votes ({c.percentage}%)</span>
                  </div>
                  <div className="result-bar-track">
                    <div className="result-bar-fill" style={{ width: `${c.percentage}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  )
}
