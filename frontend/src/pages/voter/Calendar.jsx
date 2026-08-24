import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useNavigate } from 'react-router-dom'
import VoterLayout from '../../layouts/VoterLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import voteService from '../../services/voteService'

export default function Calendar() {
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await voteService.getVoterElections()
        if (res.data.success) setElections(res.data.data.elections)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const statusColor = (s) => {
    switch (s) {
      case 'ACTIVE': return '#10b981'
      case 'UPCOMING': return '#3b82f6'
      case 'COMPLETED': return '#8b5cf6'
      default: return '#94a3b8'
    }
  }

  const events = elections.map(e => ({
    id: String(e.id),
    title: e.title,
    start: e.start_datetime,
    end: e.end_datetime,
    backgroundColor: statusColor(e.status),
    borderColor: statusColor(e.status),
    extendedProps: { ...e },
  }))

  const handleEventClick = (info) => {
    setSelectedEvent(info.event.extendedProps)
  }

  if (loading) return <VoterLayout><LoadingSpinner /></VoterLayout>

  return (
    <VoterLayout title="Election Calendar">
      <div className="page-header">
        <div className="page-title">
          <h1>Election Calendar</h1>
          <p>View upcoming, active, and completed elections on the calendar</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#3b82f6' }} />
          <span className="text-sm">Upcoming</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981' }} />
          <span className="text-sm">Active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#8b5cf6' }} />
          <span className="text-sm">Completed</span>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            eventClick={handleEventClick}
            height="auto"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek',
            }}
          />
        </div>
      </div>

      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedEvent.title}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedEvent(null)}>✕</button>
            </div>
            <div className="modal-body">
              {selectedEvent.description && <p style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>{selectedEvent.description}</p>}
              <div style={{ display: 'grid', gap: 8 }}>
                <p><strong>Status:</strong> <span className={`badge badge-${selectedEvent.status?.toLowerCase()}`}>{selectedEvent.status}</span></p>
                <p><strong>Start:</strong> {new Date(selectedEvent.start_datetime).toLocaleString()}</p>
                <p><strong>End:</strong> {new Date(selectedEvent.end_datetime).toLocaleString()}</p>
                <p><strong>Candidates:</strong> {selectedEvent.total_candidates}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedEvent(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setSelectedEvent(null); navigate(`/voter/elections/${selectedEvent.id}`) }}>View Details</button>
            </div>
          </div>
        </div>
      )}
    </VoterLayout>
  )
}
