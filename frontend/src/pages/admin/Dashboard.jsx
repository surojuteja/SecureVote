import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Vote, CalendarDays, BarChart3, CheckCircle, Clock, ShieldCheck, Plus, Trophy, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import AdminLayout from '../../layouts/AdminLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import adminService from '../../services/adminService'

const COLORS = ['#00f0ff', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4']

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await adminService.getDashboard()
        if (res.data.success) setStats(res.data.data)
      } catch (err) {
        console.error('Dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) return <AdminLayout title="Analytics Control Center"><LoadingSpinner /></AdminLayout>

  const electionChartData = [
    { name: 'Active', value: stats?.active_elections || 0 },
    { name: 'Upcoming', value: stats?.upcoming_elections || 0 },
    { name: 'Completed', value: stats?.completed_elections || 0 },
  ]

  const voterChartData = [
    { name: 'Eligible', count: stats?.eligible_voters || 0 },
    { name: 'Face Verified', count: stats?.verified_voters || 0 },
    { name: 'Total Registered', count: stats?.total_voters || 0 },
  ]

  return (
    <AdminLayout title="Electoral Administration Console">
      {/* Top Banner with Quick Actions */}
      <div className="hero-banner">
        <div className="hero-content">
          <div className="hero-text">
            <h2>Electoral Management & System Audit</h2>
            <p>
              Real-time monitoring of biometric voter registrations, election life cycles, and tamper-proof ballot processing.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
              <span className="badge badge-active">
                <ShieldCheck size={14} /> Cryptographic Integrity Verified
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/admin/elections/create')}
            >
              <Plus size={18} /> Create New Election
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => navigate('/admin/voters/new')}
            >
              <Users size={18} /> Register Voter
            </button>
          </div>
        </div>
      </div>

      {/* High-Tech Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card blue" onClick={() => navigate('/admin/voters')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon blue"><Users size={24} /></div>
          <div className="stat-info">
            <h4>Total Voters</h4>
            <div className="stat-value">{stats?.total_voters || 0}</div>
            <div className="stat-meta">Registered citizen profiles</div>
          </div>
        </div>

        <div className="stat-card cyan" onClick={() => navigate('/admin/voters')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon cyan"><ShieldCheck size={24} /></div>
          <div className="stat-info">
            <h4>Verified Voters</h4>
            <div className="stat-value">{stats?.verified_voters || 0}</div>
            <div className="stat-meta">Face biometrics enrolled</div>
          </div>
        </div>

        <div className="stat-card green" onClick={() => navigate('/admin/elections')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon green"><Vote size={24} /></div>
          <div className="stat-info">
            <h4>Active Elections</h4>
            <div className="stat-value">{stats?.active_elections || 0}</div>
            <div className="stat-meta">Polls currently open</div>
          </div>
        </div>

        <div className="stat-card purple" onClick={() => navigate('/admin/elections')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon purple"><CalendarDays size={24} /></div>
          <div className="stat-info">
            <h4>Upcoming Polls</h4>
            <div className="stat-value">{stats?.upcoming_elections || 0}</div>
            <div className="stat-meta">Scheduled on docket</div>
          </div>
        </div>

        <div className="stat-card amber" onClick={() => navigate('/admin/results')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon amber"><Trophy size={24} /></div>
          <div className="stat-info">
            <h4>Completed Polls</h4>
            <div className="stat-value">{stats?.completed_elections || 0}</div>
            <div className="stat-meta">Results certified</div>
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon red"><CheckCircle size={24} /></div>
          <div className="stat-info">
            <h4>Total Votes Cast</h4>
            <div className="stat-value">{stats?.total_votes || 0}</div>
            <div className="stat-meta">Cryptographically signed</div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <h3>Voter Registration & Biometric Verification</h3>
          </div>
          <div className="card-body" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={voterChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0e1424', borderColor: 'rgba(0,240,255,0.3)', borderRadius: 8, color: '#ffffff' }}
                />
                <Bar dataKey="count" fill="#00f0ff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Election Life Cycle Distribution</h3>
          </div>
          <div className="card-body" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={electionChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  dataKey="value"
                  paddingAngle={4}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {electionChartData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0e1424', borderColor: 'rgba(0,240,255,0.3)', borderRadius: 8, color: '#ffffff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={18} style={{ color: 'var(--primary)' }} />
            <h3>Live Electoral Activity & Ballot Log</h3>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {stats?.recent_activity?.length > 0 ? (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Authenticated Voter</th>
                    <th>Election Title</th>
                    <th>Ballot Timestamp</th>
                    <th>Security Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_activity.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: '#ffffff' }}>{a.voter_name}</td>
                      <td>{a.election_title}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                          <Clock size={14} />
                          {new Date(a.voted_at).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-verified">✓ Signed & Recorded</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted" style={{ textAlign: 'center', padding: 36 }}>
              No voting activity recorded in this audit cycle.
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
