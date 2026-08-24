import { useState, useEffect } from 'react'
import { Bell, CheckCheck, Mail } from 'lucide-react'
import VoterLayout from '../../layouts/VoterLayout'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import { useToast } from '../../components/Toast'
import notificationService from '../../services/notificationService'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await notificationService.getNotifications()
        if (res.data.success) setNotifications(res.data.data.notifications)
      } catch (err) {
        addToast('Failed to load notifications', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (err) { /* silent */ }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      addToast('All marked as read', 'success')
    } catch (err) {
      addToast('Failed to mark all as read', 'error')
    }
  }

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const typeIcon = (type) => {
    const colors = {
      VOTE_CONFIRMATION: 'var(--success)',
      ELECTION_CREATED: 'var(--info)',
      ELECTION_STARTED: 'var(--accent-500)',
      ELECTION_COMPLETED: 'var(--primary-500)',
      RESULTS_PUBLISHED: '#8b5cf6',
    }
    return colors[type] || 'var(--gray-400)'
  }

  return (
    <VoterLayout title="Notifications">
      <div className="page-header">
        <div className="page-title">
          <h1>Notifications</h1>
          <p>{notifications.filter(n => !n.is_read).length} unread</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button className="btn btn-outline btn-sm" onClick={handleMarkAllRead}>
            <CheckCheck size={16} /> Mark All Read
          </button>
        )}
      </div>

      {loading ? <LoadingSpinner /> : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" message="You're all caught up!" />
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="notification-list">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                >
                  <div className="notification-icon" style={{ background: `${typeIcon(n.type)}15`, color: typeIcon(n.type) }}>
                    <Mail size={18} />
                  </div>
                  <div className="notification-content" style={{ flex: 1 }}>
                    <h4>{n.title}</h4>
                    <p>{n.message}</p>
                    <span className="notification-time">{timeAgo(n.created_at)}</span>
                  </div>
                  {!n.is_read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-500)', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </VoterLayout>
  )
}
