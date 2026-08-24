import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Vote, CalendarDays, BarChart3,
  Bell, User, LogOut, Shield, ClipboardList, Trophy, History,
  Sparkles, ChevronRight
} from 'lucide-react'

export default function Sidebar({ mobile, onClose }) {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Analytics Dashboard' },
    { to: '/admin/voters', icon: Users, label: 'Voter Registry' },
    { to: '/admin/elections', icon: ClipboardList, label: 'Election Manager' },
    { to: '/admin/results', icon: Trophy, label: 'Live Results' },
    { to: '/admin/notifications', icon: Bell, label: 'Broadcasts' },
    { to: '/admin/login-history', icon: History, label: 'Security & Audit' },
  ]

  const voterLinks = [
    { to: '/voter/dashboard', icon: LayoutDashboard, label: 'Voter Overview' },
    { to: '/voter/elections', icon: Vote, label: 'Cast Vote / Polls' },
    { to: '/voter/calendar', icon: CalendarDays, label: 'Election Calendar' },
    { to: '/voter/results', icon: Trophy, label: 'Election Outcomes' },
    { to: '/voter/notifications', icon: Bell, label: 'Alerts & Notices' },
    { to: '/voter/profile', icon: User, label: 'Biometric Profile' },
  ]

  const links = isAdmin ? adminLinks : voterLinks

  return (
    <aside className={`sidebar ${mobile ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Shield size={24} />
        </div>
        <div className="sidebar-brand-text">
          <h3>SecureVote</h3>
          <p>{isAdmin ? 'Admin Console' : 'Voter Portal'}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">
          {isAdmin ? 'Electoral Controls' : 'Navigation Menu'}
        </div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <link.icon size={19} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-mini-card">
          <div className="user-avatar-badge">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-info-text">
            <div className="user-name">{user?.username || 'Authenticated User'}</div>
            <div className="user-role-badge">{user?.role || 'VOTER'}</div>
          </div>
        </div>

        <button
          className="btn btn-outline btn-sm"
          onClick={handleLogout}
          style={{ width: '100%', justifyContent: 'center', gap: 8, borderColor: 'rgba(244, 63, 94, 0.25)', color: '#fb7185' }}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
