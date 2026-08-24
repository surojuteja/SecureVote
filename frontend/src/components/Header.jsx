import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, Menu, ShieldCheck, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import notificationService from '../services/notificationService'

export default function Header({ title, onMenuToggle }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await notificationService.getNotifications()
        if (res.data.success) {
          setUnreadCount(res.data.data.unread_count || 0)
        }
      } catch (err) {
        // Silently fail if not connected or unauthenticated
      }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const notifPath = user?.role === 'ADMIN' ? '/admin/notifications' : '/voter/notifications'

  // Extract path section for breadcrumbs
  const pathParts = location.pathname.split('/').filter(Boolean)

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="btn btn-ghost btn-icon"
          onClick={onMenuToggle}
          id="menu-toggle"
          aria-label="Toggle navigation menu"
          style={{ display: 'none' }}
        >
          <Menu size={20} />
        </button>

        <div className="header-title-box">
          <h2>{title}</h2>
          <div className="header-breadcrumbs">
            <span>SecureVote</span>
            {pathParts.map((part, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ChevronRight size={12} />
                <span style={{ textTransform: 'capitalize' }}>{part.replace(/-/g, ' ')}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="system-status-pill">
          <div className="status-dot-pulse" />
          <span>Biometric Engine: Active</span>
        </div>

        <button
          className="header-btn"
          onClick={() => navigate(notifPath)}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="header-notification-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
