import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Vote, Clock, CalendarDays, Eye, UserPlus, Search, AlertTriangle } from 'lucide-react'
import VoterLayout from '../../layouts/VoterLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import voteService from '../../services/voteService'

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({ totalSeconds: 0, formatted: '', isUnder30Min: false })

  useEffect(() => {
    if (!targetDate) return

    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft({ totalSeconds: 0, formatted: '00:00:00', isUnder30Min: false })
        return
      }
      const totalSec = Math.floor(diff / 1000)
      const days = Math.floor(totalSec / 86400)
      const hours = Math.floor((totalSec % 86400) / 3600)
      const mins = Math.floor((totalSec % 3600) / 60)
      const secs = totalSec % 60

      const isUnder30 = totalSec <= 1800

      let formatted = ''
      if (days > 0) {
        formatted = `${days}d ${hours}h ${mins}m ${secs}s`
      } else if (hours > 0) {
        formatted = `${hours}h ${mins}m ${secs}s`
      } else {
        formatted = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`
      }

      setTimeLeft({ totalSeconds: totalSec, formatted, isUnder30Min: isUnder30 })
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  return timeLeft
}

function ElectionItemCard({ election, onNavigate }) {
  const isUpcoming = election.status === 'UPCOMING'
  const isActive = election.status === 'ACTIVE'
  const targetDate = isUpcoming ? election.start_datetime : isActive ? election.end_datetime : null
  const countdown = useCountdown(targetDate)

  const statusBadge = (s) => {
    const cls = { UPCOMING: 'badge-upcoming', ACTIVE: 'badge-active', COMPLETED: 'badge-completed' }
    return <span className={`badge ${cls[s] || ''}`}>{s}</span>
  }

  return (
    <div className="election-card" style={isUpcoming && countdown.isUnder30Min ? { borderColor: 'var(--warning)', boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)' } : {}}>
      <div className="election-card-top">
        <div>
          <h3>{election.title}</h3>
          <p>{election.description || 'Official electoral contest.'}</p>
        </div>
        {isUpcoming && countdown.isUnder30Min ? (
          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b' }}>
            <AlertTriangle size={12} /> Starts &lt; 30m
          </span>
        ) : (
          statusBadge(election.status)
        )}
      </div>

      {isUpcoming && countdown.isUnder30Min && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed rgba(245, 158, 11, 0.4)',
          borderRadius: 'var(--radius-md)', padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8
        }}>
          <AlertTriangle size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
          <div style={{ fontSize: '0.8rem', color: '#fef08a' }}>
            <strong>WARNING:</strong> Polling opens in <strong>{countdown.formatted}</strong>!
          </div>
        </div>
      )}

      <div className="election-card-meta">
        <div className="election-card-meta-row">
          <span><CalendarDays size={14} style={{ display: 'inline', marginRight: 6 }} /> Start Time:</span>
          <strong style={{ color: '#ffffff' }}>{new Date(election.start_datetime).toLocaleString()}</strong>
        </div>
        <div className="election-card-meta-row">
          <span><Clock size={14} style={{ display: 'inline', marginRight: 6 }} /> End Time:</span>
          <strong style={{ color: '#ffffff' }}>{new Date(election.end_datetime).toLocaleString()}</strong>
        </div>
        {targetDate && (
          <div className="election-card-meta-row">
            <span>{isUpcoming ? 'Countdown to Open:' : 'Time Remaining:'}</span>
            <strong style={{ color: isUpcoming && countdown.isUnder30Min ? '#fbbf24' : isActive ? 'var(--success)' : 'var(--primary)', fontFamily: 'monospace' }}>
              {countdown.formatted}
            </strong>
          </div>
        )}
        <div className="election-card-meta-row">
          <span>Candidates:</span>
          <strong style={{ color: '#ffffff' }}>{election.total_candidates} nominees</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
        {election.status === 'ACTIVE' && (
          <button
            className="btn btn-success btn-sm"
            style={{ flex: 1 }}
            onClick={() => onNavigate(`/voter/elections/${election.id}/vote`)}
          >
            <Vote size={16} /> Cast Vote
          </button>
        )}
        {election.status === 'UPCOMING' && (
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            onClick={() => onNavigate(`/voter/elections/${election.id}`)}
          >
            <UserPlus size={16} /> Candidacy / Info
          </button>
        )}
        <button
          className="btn btn-outline btn-sm"
          onClick={() => onNavigate(`/voter/elections/${election.id}`)}
        >
          <Eye size={16} /> Details
        </button>
      </div>
    </div>
  )
}

export default function Elections() {
  const [elections, setElections] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await voteService.getVoterElections()
        if (res.data.success) setElections(res.data.data.elections || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [])

  const filtered = elections.filter(e => {
    const matchesFilter = filter === 'ALL' || e.status === filter
    const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || (e.description && e.description.toLowerCase().includes(search.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  return (
    <VoterLayout title="Electoral Contests">
      <div className="page-header">
        <div className="page-title">
          <h1>Elections & Ballots</h1>
          <p>Discover active voting contests, upcoming polls with live timers, and past results</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="toolbar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            className="form-input"
            placeholder="Search elections by title or topic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['ALL', 'ACTIVE', 'UPCOMING', 'COMPLETED'].map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All Contests' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No elections match your filter"
          message="Try changing your search keywords or switching filter tabs."
        />
      ) : (
        <div className="elections-grid">
          {filtered.map(e => (
            <ElectionItemCard key={e.id} election={e} onNavigate={navigate} />
          ))}
        </div>
      )}
    </VoterLayout>
  )
}
