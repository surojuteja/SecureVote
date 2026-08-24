import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Vote, CalendarDays, Bell, Trophy, Clock, ShieldCheck, ArrowRight, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'
import VoterLayout from '../../layouts/VoterLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'
import voteService from '../../services/voteService'
import notificationService from '../../services/notificationService'

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

function UpcomingElectionCard({ election, onNavigate }) {
  const countdown = useCountdown(election.start_datetime)

  return (
    <div className="election-card" style={countdown.isUnder30Min ? { borderColor: 'var(--warning)', boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)' } : {}}>
      <div className="election-card-top">
        <div>
          <h3>{election.title}</h3>
          <p>{election.description || 'Scheduled electoral voting contest.'}</p>
        </div>
        {countdown.isUnder30Min ? (
          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b', animation: 'pulse 1.5s infinite' }}>
            <AlertTriangle size={12} /> Starts &lt; 30m
          </span>
        ) : (
          <span className="badge badge-upcoming">Upcoming</span>
        )}
      </div>

      {countdown.isUnder30Min && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed rgba(245, 158, 11, 0.4)',
          borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10
        }}>
          <AlertTriangle size={18} style={{ color: '#fbbf24', flexShrink: 0 }} />
          <div style={{ fontSize: '0.82rem', color: '#fef08a' }}>
            <strong>WARNING:</strong> Polling opens in <strong>{countdown.formatted}</strong>! Please test your camera.
          </div>
        </div>
      )}

      <div className="election-card-meta">
        <div className="election-card-meta-row">
          <span><CalendarDays size={14} style={{ display: 'inline', marginRight: 6 }} /> Start Time:</span>
          <strong style={{ color: '#ffffff' }}>{new Date(election.start_datetime).toLocaleString()}</strong>
        </div>
        <div className="election-card-meta-row">
          <span><Clock size={14} style={{ display: 'inline', marginRight: 6 }} /> Countdown:</span>
          <strong style={{ color: countdown.isUnder30Min ? '#fbbf24' : 'var(--primary)', fontFamily: 'monospace' }}>
            {countdown.formatted}
          </strong>
        </div>
      </div>

      <button
        className="btn btn-outline btn-sm"
        style={{ marginTop: 'auto' }}
        onClick={() => onNavigate(`/voter/elections/${election.id}`)}
      >
        View Details & Candidates
      </button>
    </div>
  )
}

function ActiveElectionCard({ election, onNavigate }) {
  const countdown = useCountdown(election.end_datetime)

  return (
    <div className="election-card">
      <div className="election-card-top">
        <div>
          <h3>{election.title}</h3>
          <p>{election.description || 'Cast your ballot before polling closes.'}</p>
        </div>
        <span className="badge badge-active">Live</span>
      </div>

      <div className="election-card-meta">
        <div className="election-card-meta-row">
          <span><Clock size={14} style={{ display: 'inline', marginRight: 6 }} /> Closes In:</span>
          <strong style={{ color: 'var(--success)', fontFamily: 'monospace' }}>{countdown.formatted}</strong>
        </div>
        <div className="election-card-meta-row">
          <span>Candidates:</span>
          <strong style={{ color: '#ffffff' }}>{election.total_candidates} registered</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
        <button
          className="btn btn-success btn-sm"
          style={{ flex: 1 }}
          onClick={() => onNavigate(`/voter/elections/${election.id}/vote`)}
        >
          <Vote size={16} /> Vote Now
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => onNavigate(`/voter/elections/${election.id}`)}
        >
          Details
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { voter } = useAuth()
  const navigate = useNavigate()
  const [elections, setElections] = useState([])
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [elRes, notifRes] = await Promise.all([
          voteService.getVoterElections(),
          notificationService.getNotifications(),
        ])
        if (elRes.data.success) setElections(elRes.data.data.elections || [])
        if (notifRes.data.success) setUnreadNotifs(notifRes.data.data.unread_count || 0)
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

  const active = elections.filter(e => e.status === 'ACTIVE')
  const upcoming = elections.filter(e => e.status === 'UPCOMING')
  const completed = elections.filter(e => e.status === 'COMPLETED')

  // Check if any upcoming election is starting within 30 minutes
  const startingSoon = upcoming.filter(e => {
    const diff = new Date(e.start_datetime).getTime() - Date.now()
    return diff > 0 && diff <= 1800000
  })

  if (loading) return <VoterLayout><LoadingSpinner /></VoterLayout>

  return (
    <VoterLayout title="Voter Dashboard">
      {/* 30-minute Pre-Polling Alert Banner if starting soon */}
      {startingSoon.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
          border: '2px solid #f59e0b', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 24,
          boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 style={{ color: '#fbbf24', fontSize: '1.15rem', marginBottom: 2 }}>
                ⚠️ Warning: Polling for "{startingSoon[0].title}" Starts in &lt; 30 Minutes!
              </h3>
              <p style={{ color: '#fef08a', fontSize: '0.85rem' }}>
                Please test your camera and be ready for facial authentication when polling opens.
              </p>
            </div>
          </div>
          <button
            className="btn btn-warning btn-sm"
            onClick={() => navigate(`/voter/elections/${startingSoon[0].id}`)}
          >
            Review Candidates & Details
          </button>
        </div>
      )}

      {/* Welcome Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <div className="hero-text">
            <h2>Welcome back, {voter?.full_name || 'Citizen'}!</h2>
            <p>
              Your verified electronic voting portal. You will receive notifications whenever polling begins or certified election results are published.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
              <span className="badge badge-verified">
                <ShieldCheck size={14} /> Biometrics Verified
              </span>
              <span className="badge badge-eligible">
                Voter ID: {voter?.voter_id || 'VOT001'}
              </span>
            </div>
          </div>

          {active.length > 0 && (
            <button
              className="btn btn-success btn-lg"
              onClick={() => navigate(`/voter/elections/${active[0].id}/vote`)}
              style={{ boxShadow: '0 0 25px var(--success-glow)' }}
            >
              <Vote size={20} />
              Vote in Active Election
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card green" onClick={() => navigate('/voter/elections')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon green"><Vote size={24} /></div>
          <div className="stat-info">
            <h4>Active Elections</h4>
            <div className="stat-value">{active.length}</div>
            <div className="stat-meta">Open for voting now</div>
          </div>
        </div>

        <div className="stat-card blue" onClick={() => navigate('/voter/calendar')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon blue"><CalendarDays size={24} /></div>
          <div className="stat-info">
            <h4>Upcoming Polls</h4>
            <div className="stat-value">{upcoming.length}</div>
            <div className="stat-meta">Scheduled on docket</div>
          </div>
        </div>

        <div className="stat-card purple" onClick={() => navigate('/voter/results')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon purple"><Trophy size={24} /></div>
          <div className="stat-info">
            <h4>Certified Results</h4>
            <div className="stat-value">{completed.length}</div>
            <div className="stat-meta">Published outcomes</div>
          </div>
        </div>

        <div className="stat-card amber" onClick={() => navigate('/voter/notifications')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon amber"><Bell size={24} /></div>
          <div className="stat-info">
            <h4>Alerts & Notices</h4>
            <div className="stat-value">{unreadNotifs}</div>
            <div className="stat-meta">Unread notifications</div>
          </div>
        </div>
      </div>

      {/* Live Active Elections */}
      {active.length > 0 ? (
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="status-dot-pulse" />
              <h3>Live Active Elections — Cast Your Ballot</h3>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/voter/elections')}>
              View All Polls <ArrowRight size={14} />
            </button>
          </div>
          <div className="card-body">
            <div className="elections-grid">
              {active.map(e => (
                <ActiveElectionCard key={e.id} election={e} onNavigate={navigate} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 24, textAlign: 'center', padding: '36px 20px' }}>
          <CheckCircle2 size={44} style={{ color: 'var(--success)', margin: '0 auto 12px' }} />
          <h3>No Active Elections Right Now</h3>
          <p className="text-secondary" style={{ maxWidth: 460, margin: '8px auto 18px' }}>
            There are no elections currently in progress. You will receive an email and in-app notification when the next poll starts.
          </p>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/voter/calendar')}>
            <CalendarDays size={16} /> View Election Calendar
          </button>
        </div>
      )}

      {/* Upcoming Elections with 30m Warning Ticker */}
      {upcoming.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>📅 Upcoming Scheduled Elections (Live Countdown Tickers)</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/voter/calendar')}>
              Open Calendar
            </button>
          </div>
          <div className="card-body">
            <div className="elections-grid">
              {upcoming.map(e => (
                <UpcomingElectionCard key={e.id} election={e} onNavigate={navigate} />
              ))}
            </div>
          </div>
        </div>
      )}
    </VoterLayout>
  )
}
